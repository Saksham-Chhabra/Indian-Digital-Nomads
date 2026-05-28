import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "your_nomad_secret";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return { userId: decoded.userId };
}

export function verifyRefreshToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return { userId: decoded.userId };
}

export function signTokenPair(userId: string) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}
