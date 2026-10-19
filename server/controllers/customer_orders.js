
const { PrismaClient, DeliveryMethod } = require("@prisma/client");
const prisma = new PrismaClient();

const { createOrderUpdateNotification } = require("../utills/notificationHelpers");

const VALID_DELIVERY_METHODS = Object.values(DeliveryMethod);

function validateOrderData(body, existingOrder = null) {
  const data = {
    name: body.name ?? existingOrder?.name,
    phone: body.phone ?? existingOrder?.phone,
    email: body.email ?? existingOrder?.email,
    deliveryMethod:
      body.deliveryMethod ?? existingOrder?.deliveryMethod ?? "PICKUP",
    adress: body.adress ?? existingOrder?.adress ?? null,
    postalCode: body.postalCode ?? existingOrder?.postalCode ?? null,
    city: body.city ?? existingOrder?.city ?? null,
    province: body.province ?? existingOrder?.province ?? null,
    district: body.district ?? existingOrder?.district ?? null,
    orderNotice: body.orderNotice ?? existingOrder?.orderNotice ?? null,
    total: body.total ?? existingOrder?.total,
    status: body.status ?? existingOrder?.status ?? "pending",
  };

  const errors = [];

  if (typeof data.name !== "string" || !data.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (typeof data.phone !== "string" || !data.phone.trim()) {
    errors.push({ field: "phone", message: "Phone is required" });
  }

  if (
    typeof data.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.push({ field: "email", message: "A valid email is required" });
  }

  if (!VALID_DELIVERY_METHODS.includes(data.deliveryMethod)) {
    errors.push({
      field: "deliveryMethod",
      message: "Delivery method must be PICKUP or SHIPPING",
    });
  }

  if (
    data.deliveryMethod === "SHIPPING"
  ) {
    for (const field of [
      "adress",
      "postalCode",
      "city",
      "province",
      "district",
    ]) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        errors.push({
          field,
          message: `${field} is required for shipping`,
        });
      }
    }
  }

  if (!Number.isInteger(data.total) || data.total < 0) {
    errors.push({
      field: "total",
      message: "Total must be a non-negative integer",
    });
  }

  if (typeof data.status !== "string" || !data.status.trim()) {
    errors.push({ field: "status", message: "Status is required" });
  }

  if (
    data.orderNotice !== null &&
    typeof data.orderNotice !== "string"
  ) {
    errors.push({
      field: "orderNotice",
      message: "Order notice must be a string or null",
    });
  }

  return { isValid: errors.length === 0, errors, data };
}

function getPrismaErrorResponse(error, response, action) {
  console.error(`Error ${action}:`, error);

  if (error.code === "P2025") {
    return response.status(404).json({
      error: "Order not found",
    });
  }

  return response.status(500).json({
    error: "Internal server error",
    details: `Failed to ${action}. Please try again later.`,
  });
}


async function createCustomerOrder(request, response) {
  try {
    if (
      !request.body ||
      typeof request.body !== "object" ||
      Array.isArray(request.body)
    ) {
      return response.status(400).json({
        error: "Invalid request body",
      });
    }

    const validation = validateOrderData(request.body);

    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const data = validation.data;

    // Untuk development: userId dikirim dari frontend.
    const userId =
      typeof request.body.userId === "string"
        ? request.body.userId.trim()
        : null;

    // Pastikan userId benar-benar merujuk pada user yang ada.
    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existingUser) {
        return response.status(400).json({
          error: "Invalid userId",
          message: "User does not exist",
        });
      }
    }

    const order = await prisma.customer_order.create({
      data: {
        ...(userId ? { userId } : {}),
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        deliveryMethod: data.deliveryMethod,
        adress: data.adress?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        city: data.city?.trim() || null,
        province: data.province?.trim() || null,
        district: data.district?.trim() || null,
        orderNotice: data.orderNotice?.trim() || null,
        total: data.total,
        status: data.status,
      },
    });

    // Notifikasi gagal tidak membatalkan pesanan.
    try {
      let user = null;

      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
        });
      }

      if (!user) {
        user = await prisma.user.findUnique({
          where: {
            email: data.email.trim().toLowerCase(),
          },
        });
      }

      if (user) {
        await createOrderUpdateNotification(
          user.id,
          "confirmed",
          order.id,
          order.total
        );
      }
    } catch (notificationError) {
      console.error(
        "Failed to create order notification:",
        notificationError
      );
    }

    return response.status(201).json({
      id: order.id,
      orderNumber: order.id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);

    if (error.code === "P2002") {
      return response.status(409).json({
        error: "Order conflict",
      });
    }

    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to create order. Please try again later.",
    });
  }
}

async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;

    console.log("[UPDATE ORDER] Request received:", {
      id,
      statusFromBody: request.body?.status,
    });

    if (!id) {
      return response.status(400).json({
        error: "Order ID is required",
      });
    }

    if (
      !request.body ||
      typeof request.body !== "object" ||
      Array.isArray(request.body)
    ) {
      return response.status(400).json({
        error: "Invalid request body",
      });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return response.status(404).json({
        error: "Order not found",
      });
    }

    // Merge existing values so partial updates are supported.
    const validation = validateOrderData(request.body, existingOrder);

    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const data = validation.data;

    const updatedOrder = await prisma.customer_order.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        deliveryMethod: data.deliveryMethod,
        adress: data.adress?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        city: data.city?.trim() || null,
        province: data.province?.trim() || null,
        district: data.district?.trim() || null,
        orderNotice: data.orderNotice?.trim() || null,
        total: data.total,
        status: data.status,
      },
    });

    if (existingOrder.status !== updatedOrder.status) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: updatedOrder.email },
        });

        if (user) {
          await createOrderUpdateNotification(
            user.id,
            updatedOrder.status,
            updatedOrder.id,
            updatedOrder.total
          );
        }
      } catch (notificationError) {
        console.error("Failed to create status notification:", notificationError);
      }
    }

    return response.status(200).json(updatedOrder);
  } catch (error) {
    return getPrismaErrorResponse(error, response, "update order");
  }
}

async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Order ID is required",
      });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return response.status(404).json({
        error: "Order not found",
      });
    }

    // Delete child rows first if your relation does not use onDelete: Cascade.
    await prisma.$transaction([
      prisma.customer_order_product.deleteMany({
        where: { customerOrderId: id },
      }),
      prisma.customer_order.delete({
        where: { id },
      }),
    ]);

    return response.status(204).send();
  } catch (error) {
    return getPrismaErrorResponse(error, response, "delete order");
  }
}

async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Order ID is required",
      });
    }

    const order = await prisma.customer_order.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return response.status(404).json({
        error: "Order not found",
      });
    }

    return response.status(200).json(order);
  } catch (error) {
    return getPrismaErrorResponse(error, response, "fetch order");
  }
}

async function getAllOrders(request, response) {
  try {
    const page = Number.parseInt(request.query.page, 10) || 1;
    const limit = Number.parseInt(request.query.limit, 10) || 50;

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return response.status(400).json({
        error: "Invalid pagination parameters",
        details: "Page must be >= 1 and limit must be between 1 and 100",
      });
    }

    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dateTime: "desc" },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.customer_order.count(),
    ]);

    return response.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return getPrismaErrorResponse(error, response, "fetch orders");
  }
}

async function getMyOrders(request, response) {
  try {
    const userId =
      typeof request.query.userId === "string"
        ? request.query.userId.trim()
        : "";

    console.log("[GET MY ORDERS] User ID:", userId || "(empty)");

    if (!userId) {
      return response.status(400).json({
        error: "Bad Request",
        message: "userId is required",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(request.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(request.query.limit, 10) || 10
      )
    );

    const where = { userId };

    const [orders, total] = await Promise.all([
      prisma.customer_order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          dateTime: "desc",
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  mainImage: true,
                  price: true,
                },
              },
            },
          },
        },
      }),

      prisma.customer_order.count({
        where,
      }),
    ]);

    return response.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);

    return response.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch orders",
    });
  }
}


module.exports = {
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getCustomerOrder,
  getAllOrders,
  getMyOrders,
};
