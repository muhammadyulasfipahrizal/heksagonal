
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const genericResponse = () =>
  NextResponse.json({
    message:
      "If an account exists for that email, reset instructions will be sent.",
  });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.email !== "string" ||
      body.email.trim().length > 254
    ) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return genericResponse();
    }

    const identifier = `password-reset:${user.email}`;

    // Invalidate previous reset links for this email.
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashedToken,
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      throw new Error("APP_URL is not configured.");
    }

    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", rawToken);

    try {
      await sendPasswordResetEmail(
        user.email,
        resetUrl.toString()
      );
    } catch (error) {
      await prisma.verificationToken.deleteMany({
        where: { identifier },
      });

      throw error;
    }

    return genericResponse();
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { message: "Unable to process your request. Please try again later." },
      { status: 500 }
    );
  }
}
