
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { asyncHandler, AppError } = require("../utills/errorHandler");

const createOrderProduct = asyncHandler(async (request, response) => {
  const { customerOrderId, productId, quantity } = request.body;

  if (!customerOrderId || !productId) {
    throw new AppError("Customer order ID and product ID are required", 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("Quantity must be a positive integer", 400);
  }

  const [order, product] = await Promise.all([
    prisma.customer_order.findUnique({
      where: { id: customerOrderId },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    }),
  ]);

  if (!order) {
    throw new AppError("Customer order not found", 404);
  }

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const orderProduct = await prisma.customer_order_product.create({
    data: {
      customerOrderId,
      productId,
      quantity,
    },
    include: {
      product: true,
    },
  });

  return response.status(201).json(orderProduct);
});

const updateProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { customerOrderId, productId, quantity } = request.body;

  const existingItem = await prisma.customer_order_product.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new AppError("Order product not found", 404);
  }

  if (
    quantity !== undefined &&
    (!Number.isInteger(quantity) || quantity <= 0)
  ) {
    throw new AppError("Quantity must be a positive integer", 400);
  }

  if (customerOrderId) {
    const order = await prisma.customer_order.findUnique({
      where: { id: customerOrderId },
      select: { id: true },
    });

    if (!order) {
      throw new AppError("Customer order not found", 404);
    }
  }

  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }
  }

  const updatedItem = await prisma.customer_order_product.update({
    where: { id },
    data: {
      ...(customerOrderId !== undefined && { customerOrderId }),
      ...(productId !== undefined && { productId }),
      ...(quantity !== undefined && { quantity }),
    },
    include: {
      product: true,
    },
  });

  return response.status(200).json(updatedItem);
});

const deleteProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  const existingItem = await prisma.customer_order_product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingItem) {
    throw new AppError("Order product not found", 404);
  }

  // Delete only the requested item, not every item in an order.
  await prisma.customer_order_product.delete({
    where: { id },
  });

  return response.status(204).send();
});

const getProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order ID is required", 400);
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
    throw new AppError("Order not found", 404);
  }

  return response.status(200).json(order.products);
});

const getAllProductOrders = asyncHandler(async (request, response) => {
  const orders = await prisma.customer_order.findMany({
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
              mainImage: true,
              price: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return response.status(200).json(
    orders.map((order) => ({
      customerOrderId: order.id,
      customerOrder: {
        name: order.name,
        phone: order.phone,
        deliveryMethod: order.deliveryMethod,
        email: order.email,
        adress: order.adress,
        postalCode: order.postalCode,
        dateTime: order.dateTime,
        status: order.status,
        city: order.city,
        province: order.province,
        district: order.district,
        orderNotice: order.orderNotice,
        total: order.total,
      },
      products: order.products.map((item) => ({
        ...item.product,
        quantity: item.quantity,
      })),
    }))
  );
});

module.exports = {
  createOrderProduct,
  updateProductOrder,
  deleteProductOrder,
  getProductOrder,
  getAllProductOrders,
};
