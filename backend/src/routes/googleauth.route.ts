import { Router } from "express";
import passport from "passport";
import { User as PrismaUser } from "@prisma/client";
import { signTokenPair } from "../config/jwt";

const router = Router();

router.get("/", (req, res, next) => {
  const role = req.query.role; // can be undefined
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    state 
  })(req, res, next);
});

router.get(
  "/callback",
  passport.authenticate("google", { 
    failureRedirect: "/login",
    keepSessionInfo: true
  }),
  async (req, res) => {
    const user = req.user as PrismaUser;
    
    // Retrieve transient auth properties from req (or session fallback)
    const isNew = (req as any).isNewUser ?? (req.session as any)?.isNew;
    const roleChosen = (req as any).roleChosenByUser ?? (req.session as any)?.roleChosen;

    console.log(`[Google Auth Callback] Session ID: ${req.sessionID}`);
    console.log(`[Google Auth Callback] Retrieved: isNew=${isNew}, roleChosen=${roleChosen}`);

    // Clean up session variables
    if (req.session) {
      delete (req.session as any).isNew;
      delete (req.session as any).roleChosen;
    }

    console.log(`[Google Auth Callback] User details: email=${user.email}, role=${user.role}`);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    // Generate JWT tokens for the authenticated user
    const tokens = signTokenPair(user.id);

    // Determine redirect path
    let targetPath: string;
    if (isNew && !roleChosen) {
      targetPath = "/auth/callback";
    } else {
      targetPath = "/auth/callback";
    }

    // Build redirect URL with tokens as query params
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNew: String(!!isNew),
      roleChosen: String(!!roleChosen),
    });

    const redirectUrl = `${frontendUrl}${targetPath}?${params.toString()}`;
    
    console.log(`[Google Auth] Redirecting user to: ${frontendUrl}${targetPath}`);
    res.redirect(redirectUrl);
  }
);

export default router;