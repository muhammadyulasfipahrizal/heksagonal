
const { getToken } = require("next-auth/jwt");

async function requireAuth(request, response, next) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error("NEXTAUTH_SECRET is not configured");

      return response.status(500).json({
        error: "Authentication is not configured",
      });
    }

    // Debug: periksa cookie yang diterima Express
    console.log(
      "Cookie header exists:",
      Boolean(request.headers.cookie)
    );

    console.log(
      "Cookie names:",
      (request.headers.cookie || "")
        .split(";")
        .map((cookie) => cookie.trim().split("=")[0])
        .filter(Boolean)
    );

    const token = await getToken({
      req: request,
      secret,
      secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://"),
    });

    console.log("NextAuth token found:", Boolean(token));
    console.log("Token user ID:", token?.id);

    if (!token || typeof token.id !== "string" || !token.id) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    request.auth = {
      userId: token.id,
    };

    return next();
  } catch (error) {
    console.error("Authentication error:", error);

    return response.status(401).json({
      error: "Invalid or expired session",
    });
  }
}

module.exports = requireAuth;
