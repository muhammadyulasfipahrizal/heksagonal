import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL || "http://localhost:3001";

async function proxyAddresses(
  request: NextRequest,
  method: "GET" | "POST"
) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const response = await fetch(`${API_URL}/api/addresses`, {
      method,
      headers: {
        Cookie: cookie,
        ...(method === "POST"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(method === "POST"
        ? { body: await request.text() }
        : {}),
      cache: "no-store",
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "application/json",
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

export async function GET(request: NextRequest) {
  return proxyAddresses(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyAddresses(request, "POST");
}