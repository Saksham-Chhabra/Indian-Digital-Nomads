import { Request, Response, NextFunction } from "express";
import { User as PrismaUser } from "@prisma/client";
import { verifyAccessToken } from "../config/jwt";
import prisma from "../config/prisma";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Try JWT from Authorization header first (localStorage flow)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: User not found",
        });
      }
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or expired token",
      });
    }
  }

  // 2. Fallback to Passport session (for Google OAuth handshake & backward compat)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ 
    success: false,
    error: "Unauthorized: Please log in to access this resource" 
  });
};


export const checkActiveStatus = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  const user = req.user as PrismaUser;

  if (user.status !== "ACTIVE") {
    const errorMessages: Record<string, string> = {
      DEACTIVATED: "Your account has been deactivated by an administrator. Please contact support.",
      SUSPENDED: "Your account is temporarily suspended due to a violation of our terms of service.",
    };

    const message = errorMessages[user.status] || "Your account is restricted.";

    if (req.xhr || req.headers.accept?.includes("json") || req.originalUrl.startsWith("/api/")) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_RESTRICTED",
        error: message,
      });
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Restricted</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen p-6 font-sans">
          <div class="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-full mb-6">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-3">Account Restricted</h1>
              <p class="text-gray-600 mb-8 leading-relaxed">${message}</p>
              <div class="space-y-3">
                  <a href="mailto:support@yourdomain.com" class="block w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                      Contact Support
                  </a>
                  <a href="/api/auth/logout" class="block w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-200 transition-colors duration-200">
                      Log Out
                  </a>
              </div>
          </div>
      </body>
      </html>
    `);
  }

  return next();
};