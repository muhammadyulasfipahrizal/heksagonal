const BASE_URL = "https://wilayah.id/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    const isProvinces =
      path.length === 1 && path[0] === "provinces";

    const validCodeLengths: Record<string, number> = {
        regencies: 2,
        districts: 5,
        villages: 8,
    };

    const isValidChildPath =
        path.length === 2 &&
        Object.hasOwn(validCodeLengths, path[0]) &&
        path[1].length === validCodeLengths[path[0]] &&
        /^\d+(?:\.\d+)*$/.test(path[1]) &&
        path[1].split(".").every((segment) => /^\d{2}$/.test(segment));

    if (!isProvinces && !isValidChildPath) {
      return Response.json(
        { message: "Invalid region endpoint" },
        { status: 400 }
      );
    }

    const endpoint = `${BASE_URL}/${path.join("/")}.json`;

    const response = await fetch(endpoint, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return Response.json(
        { message: "Failed to fetch region data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Region API error:", error);

    return Response.json(
      { message: "Internal server error while fetching region data" },
      { status: 500 }
    );
  }
}