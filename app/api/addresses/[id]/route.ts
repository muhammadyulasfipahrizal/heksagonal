
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/utils/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  label: z.string().trim().max(100).nullable().optional(),
  adress: z.string().trim().min(1).max(1000).optional(),
  postalCode: z.string().trim().min(1).max(20).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  province: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

async function getUserId() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string }
    | undefined;

  return user?.id || null;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid address data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const address = await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) return null;

      if (parsed.data.isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: parsed.data,
      });
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("PUT address error:", error);

    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const result = await prisma.address.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("DELETE address error:", error);

    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
