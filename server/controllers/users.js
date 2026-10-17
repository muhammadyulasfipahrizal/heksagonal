const prisma = require("../utills/db");
const bcrypt = require("bcryptjs");
const { asyncHandler, AppError } = require("../utills/errorHandler");

// Helper function to exclude password from user object
function excludePassword(user) {
  if (!user) return user;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

const getAllUsers = asyncHandler(async (request, response) => {
  const users = await prisma.user.findMany({});
  // Exclude password from all users
  const usersWithoutPasswords = users.map(user => excludePassword(user));
  return response.json(usersWithoutPasswords);
});


const createUser = asyncHandler(async (request, response) => {
  const { name, phone, email, password, role } = request.body;

  // Basic validation
  if (!name || !phone || !email || !password) {
    throw new AppError(
      "Name, phone, email, and password are required",
      400
    );
  }

  // Name validation
  if (typeof name !== "string" || name.trim().length < 3) {
    throw new AppError(
      "Name must be at least 3 characters long",
      400
    );
  }

  // Phone validation
  if (typeof phone !== "string" || phone.trim().length < 8) {
    throw new AppError(
      "Phone number must be at least 8 characters long",
      400
    );
  }

  // Email validation
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw new AppError("Invalid email format", 400);
  }

  // Password validation
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError(
      "Password must be at least 8 characters long",
      400
    );
  }

  // Check duplicate email
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new AppError("Email is already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 14);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
    },
  });

  // Never return the password
  return response.status(201).json({
    message: "User registered successfully",
    user: excludePassword(user),
  });
});

const updateUser = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { email, password, role } = request.body;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Prepare update data
  const updateData = {};
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email format", 400);
    }
    updateData.email = email;
  }
  if (password) {
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    updateData.password = await bcrypt.hash(password, 14);
  }
  if (role) {
    updateData.role = role;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: updateData,
  });

  // Exclude password from response
  return response.status(200).json(excludePassword(updatedUser));
});

const deleteUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  await prisma.user.delete({
    where: {
      id: id,
    },
  });
  return response.status(204).send();
});

const getUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  // Exclude password from response
  return response.status(200).json(excludePassword(user));
});

const getUserByEmail = asyncHandler(async (request, response) => {
  const { email } = request.params;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  // Exclude password from response
  return response.status(200).json(excludePassword(user));
});

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getUserByEmail,
};
