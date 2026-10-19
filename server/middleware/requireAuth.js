const { getToken } = require("next-auth/jwt");

async function requireAuth(req, res, next) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error("[AUTH] NEXTAUTH_SECRET is missing");

      return res.status(500).json({
        error: "Authentication is not configured",
      });
    }

    const token = await getToken({
      req,
      secret,
      cookieName: "next-auth.session-token",
      secureCookie: false,
    });

    if (!token) {
      console.error("[AUTH] Failed to decode NextAuth JWT");

      return res.status(401).json({
        error: "Authentication required",
        message: "Session token could not be decoded",
      });
    }

    const userId = token.id || token.sub;

    if (typeof userId !== "string" || !userId) {
      console.error("[AUTH] User ID is missing from token");

      return res.status(401).json({
        error: "Authentication required",
        message: "User ID is missing from session token",
      });
    }

    req.auth = {
      userId,
      email: typeof token.email === "string" ? token.email : undefined,
    };

    return next();
  } catch (error) {
    console.error("[AUTH] Error:", error.message);

    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}

module.exports = requireAuth;