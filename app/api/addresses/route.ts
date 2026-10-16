
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/utils/db";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30),
  label: z.string().trim().max(100).optional().nullable(),
  adress: z.string().trim().min(1).max(1000),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
});

async function getUserId() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string }
    | undefined;

  return user?.id || null;
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("GET addresses error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve addresses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid address data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          ...data,
          userId,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Address created successfully",
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST address error:", error);

    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
