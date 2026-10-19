
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/utils/db";

export const dynamic = "force-dynamic";

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) return null;

  const userId =
    typeof token.id === "string"
      ? token.id
      : typeof token.sub === "string"
        ? token.sub
        : null;

  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/profile:", error);

    return NextResponse.json(
      { message: "Gagal mengambil informasi profil." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Data yang dikirim tidak valid." },
        { status: 400 }
      );
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string;
    } = {};

    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100
      ) {
        return NextResponse.json(
          { message: "Nama wajib diisi dan maksimal 100 karakter." },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if ("email" in body) {
      if (
        typeof body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ) {
        return NextResponse.json(
          { message: "Format email tidak valid." },
          { status: 400 }
        );
      }

      data.email = body.email.trim().toLowerCase();
    }

    if ("phone" in body) {
      if (
        typeof body.phone !== "string" ||
        body.phone.trim().length > 25
      ) {
        return NextResponse.json(
          { message: "Nomor telepon tidak valid." },
          { status: 400 }
        );
      }

      data.phone = body.phone.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diperbarui." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui.",
      user,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email tersebut sudah digunakan akun lain." },
        { status: 409 }
      );
    }

    console.error("PATCH /api/profile:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
