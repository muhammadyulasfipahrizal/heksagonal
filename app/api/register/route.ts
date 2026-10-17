import prisma from "@/utils/db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { registrationSchema } from "@/utils/schema";
import { sanitizeInput, commonValidations } from "@/utils/validation";
import { handleApiError, AppError } from "@/utils/errorHandler";

export const POST = async (request: Request) => {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!commonValidations.checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
      throw new AppError(
        "Too many registration attempts. Please try again later.",
        429
      );
    }

    const body = await sanitizeInput.validateJsonInput(request);
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      throw validationResult.error;
    }

    const { name, phone, email, password } = validationResult.data;

    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedPhone) {
      throw new AppError("Name and phone number are required.", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError("Email is already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 14);

    const newUser = await prisma.user.create({
      data: {
        id: nanoid(),
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: newUser.id,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
};