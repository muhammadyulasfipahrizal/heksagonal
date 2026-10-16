import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL || "http://localhost:3001";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function proxyAddressById(
  request: NextRequest,
  context: RouteContext,
  method: "PUT" | "DELETE"
) {
  try {
    const { id } = await context.params;
    const cookie = request.headers.get("cookie") ?? "";

    const headers: HeadersInit = {
      Cookie: cookie,
    };

    let body: string | undefined;

    if (method === "PUT") {
      headers["Content-Type"] = "application/json";
      body = await request.text();
    }

    const response = await fetch(
      `${API_URL}/api/addresses/${encodeURIComponent(id)}`,
      {
        method,
        headers,
        ...(body !== undefined ? { body } : {}),
        cache: "no-store",
      }
    );

    const data = await response.text();

    return new NextResponse(data || null, {
      status: response.status,
      headers: {
        ...(response.headers.get("content-type")
          ? {
              "Content-Type":
                response.headers.get("content-type")!,
            }
          : {}),
      },
    });
  } catch (error) {
    console.error("Address proxy error:", error);

    return NextResponse.json(
      { error: "Unable to connect to address API" },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAddressById(request, context, "PUT");
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAddressById(request, context, "DELETE");
}