import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/utils/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { token, password } = body ?? {};

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { message: "Invalid token or password." },
        { status: 400 }
      );
    }

    const hashedToken = createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (
      !resetToken ||
      !resetToken.identifier.startsWith("password-reset:") ||
      resetToken.expires <= new Date()
    ) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const email = resetToken.identifier.slice(
      "password-reset:".length
    );

    const hashedPassword = await bcrypt.hash(password, 14);

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Consume the token exactly once.
        const consumed = await tx.verificationToken.deleteMany({
          where: {
            identifier: resetToken.identifier,
            token: hashedToken,
            expires: { gt: new Date() },
          },
        });

        if (consumed.count !== 1) {
          return false;
        }

        const result = await tx.user.updateMany({
          where: { email },
          data: { password: hashedPassword },
        });

        if (result.count !== 1) {
          throw new Error("Reset account no longer exists.");
        }

        return true;
      }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        message: "Unable to reset your password. Please try again.",
      },
      { status: 500 }
    );
  }
}