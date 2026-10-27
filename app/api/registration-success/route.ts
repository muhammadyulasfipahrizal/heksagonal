
import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { sendUserLoginNotificationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Please sign in to continue." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json(
        { message: "User email address was not found." },
        { status: 404 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL is not configured.");
    }

    await sendUserLoginNotificationEmail(adminEmail, {
      name: user.name?.trim() || "Not provided",
      email: user.email,
      phone: user.phone?.trim() || "Not provided",
    });

    return NextResponse.json({
      message: "Admin notification email sent successfully.",
    });
  } catch (error) {
    console.error("User login notification error:", error);

    return NextResponse.json(
      {
        message: "Unable to send the admin notification email.",
      },
      { status: 500 }
    );
  }
}
