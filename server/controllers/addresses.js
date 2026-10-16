const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ADDRESS_FIELDS = [
  "name",
  "phone",
  "label",
  "adress",
  "postalCode",
  "city",
  "province",
  "district",
  "isDefault",
];

const REQUIRED_FIELDS = [
  "name",
  "phone",
  "adress",
  "postalCode",
  "city",
  "province",
  "district",
];

function isValidBody(body) {
  return (
    body &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
}

function validateAddress(body, partial = false) {
  const errors = [];
  const data = {};

  for (const field of Object.keys(body)) {
    if (!ADDRESS_FIELDS.includes(field)) {
      errors.push({
        field,
        message: "Unknown field",
      });
    }
  }

  for (const field of ADDRESS_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      if (!partial && REQUIRED_FIELDS.includes(field)) {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }

      continue;
    }

    const value = body[field];

    if (field === "isDefault") {
      if (typeof value !== "boolean") {
        errors.push({
          field,
          message: "isDefault must be a boolean",
        });
      } else {
        data[field] = value;
      }

      continue;
    }

    if (field === "label" && value === null) {
      data.label = null;
      continue;
    }

    if (typeof value !== "string") {
      errors.push({
        field,
        message: `${field} must be a string`,
      });
      continue;
    }

    const trimmed = value.trim();

    if (!trimmed && REQUIRED_FIELDS.includes(field)) {
      errors.push({
        field,
        message: `${field} cannot be empty`,
      });
      continue;
    }

    if (field === "label" || trimmed) {
      data[field] = trimmed;
    } else if (partial && value === "") {
      errors.push({
        field,
        message: `${field} cannot be empty`,
      });
    }
  }

  if (data.name && data.name.length > 100) {
    errors.push({
      field: "name",
      message: "Name must not exceed 100 characters",
    });
  }

  if (data.phone && data.phone.length > 30) {
    errors.push({
      field: "phone",
      message: "Phone must not exceed 30 characters",
    });
  }

  if (data.label && data.label.length > 50) {
    errors.push({
      field: "label",
      message: "Label must not exceed 50 characters",
    });
  }

  if (data.postalCode && data.postalCode.length > 20) {
    errors.push({
      field: "postalCode",
      message: "Postal code must not exceed 20 characters",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

function handleAddressError(error, response, action) {
  console.error(`Error ${action}:`, error);

  if (error.code === "P2025") {
    return response.status(404).json({
      error: "Address not found",
    });
  }

  return response.status(500).json({
    error: "Internal server error",
    details: `Failed to ${action}. Please try again later.`,
  });
}

// GET /api/addresses
async function getAddresses(request, response) {
  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: request.auth.userId,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return response.status(200).json({
      addresses,
    });
  } catch (error) {
    return handleAddressError(error, response, "fetch addresses");
  }
}

// POST /api/addresses
async function createAddress(request, response) {
  try {
    if (!isValidBody(request.body)) {
      return response.status(400).json({
        error: "Invalid request body",
      });
    }

    const validation = validateAddress(request.body);

    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const { isDefault, ...addressData } = validation.data;
    const userId = request.auth.userId;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          ...addressData,
          isDefault: isDefault ?? false,
          userId,
        },
      });
    });

    return response.status(201).json({
      message: "Address created successfully",
      address,
    });
  } catch (error) {
    return handleAddressError(error, response, "create address");
  }
}

// PUT /api/addresses/:id
async function updateAddress(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Address ID is required",
      });
    }

    if (!isValidBody(request.body)) {
      return response.status(400).json({
        error: "Invalid request body",
      });
    }

    if (Object.keys(request.body).length === 0) {
      return response.status(400).json({
        error: "At least one field must be provided",
      });
    }

    const validation = validateAddress(request.body, true);

    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const userId = request.auth.userId;

    // Check ownership before modifying the address.
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAddress) {
      return response.status(404).json({
        error: "Address not found",
      });
    }

    const updatedAddress = await prisma.$transaction(async (tx) => {
      if (validation.data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      // Include userId in the update condition to enforce ownership.
      await tx.address.updateMany({
        where: {
          id,
          userId,
        },
        data: validation.data,
      });

      return tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });
    });

    if (!updatedAddress) {
      return response.status(404).json({
        error: "Address not found",
      });
    }

    return response.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    return handleAddressError(error, response, "update address");
  }
}

// DELETE /api/addresses/:id
async function deleteAddress(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Address ID is required",
      });
    }

    const result = await prisma.address.deleteMany({
      where: {
        id,
        userId: request.auth.userId,
      },
    });

    if (result.count === 0) {
      return response.status(404).json({
        error: "Address not found",
      });
    }

    return response.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    return handleAddressError(error, response, "delete address");
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};