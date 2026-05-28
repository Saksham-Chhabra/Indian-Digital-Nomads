import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import argon2 from "argon2";
import { signTokenPair, verifyRefreshToken } from "../config/jwt";



export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role } = req.body;

    // 1. Basic Validation (Zod middleware handles this, but good to have)
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already registered with this email" });
    }

    const passwordHash = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role, 
        profile: { create: {} },
      },
    });

    // Generate JWT token pair instead of using session
    const tokens = signTokenPair(newUser.id);

    return res.status(201).json({
      message: "User created and logged in successfully",
      ...tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ 
        message: "Internal server error during signup",
        devError: (error as { message: string }).message // Only do this during development!
    });
}
};

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`[Login] Successful login for: ${email}`);
    
    // Generate JWT token pair instead of using session
    const tokens = signTokenPair(user.id);

    return res.status(200).json({
      message: "Logged in successfully",
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Login Error] Exception caught in signIn:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      // Return 200 with success: false to avoid "401 Unauthorized" console errors on every landing page visit
      return res.status(200).json({ success: false, data: null });
    }

    // req.user is already populated by the protect middleware (JWT or passport)
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("[getMe Error] Exception caught in getMe:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const signOut = (req: Request, res: Response) => {
  // With JWT-based auth, logout is primarily client-side (remove tokens from localStorage).
  // Server-side we just return success. If there's a Passport session, clean it up too.
  if (req.session) {
    req.session.destroy(() => {});
  }
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Issue new token pair
    const tokens = signTokenPair(user.id);

    return res.status(200).json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    console.error("[Refresh Token Error]:", error);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

export const setupRole = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { role } = req.body;
    if (role !== "CLIENT" && role !== "FREELANCER") {
      return res.status(400).json({ error: "Invalid role. Must be CLIENT or FREELANCER." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    // Update req.user so passport session gets the fresh role
    if (req.user) {
      (req.user as any).role = role;
    }

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Setup Role Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


