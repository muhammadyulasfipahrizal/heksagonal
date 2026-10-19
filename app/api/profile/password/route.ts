
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { compare, hash } from "bcryptjs";
import prisma from "@/utils/db";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    const userId =
      typeof token?.id === "string"
        ? token.id
        : typeof token?.sub === "string"
          ? token.sub
          : null;

    if (!userId) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;
    const confirmPassword = body?.confirmPassword;

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return NextResponse.json(
        { message: "Password baru harus terdiri dari 8–128 karakter." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Konfirmasi password tidak cocok." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    if (user.password) {
      if (
        typeof currentPassword !== "string" ||
        !currentPassword
      ) {
        return NextResponse.json(
          { message: "Password lama wajib diisi." },
          { status: 400 }
        );
      }

      const isPasswordValid = await compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Password lama tidak sesuai." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hash(newPassword, 14);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("POST /api/profile/password:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui password." },
      { status: 500 }
    );
  }
}
