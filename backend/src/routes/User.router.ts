import { Router } from "express";
import { protect } from "../middlewares/auth.middleware"; 
import { signIn, signUp, getMe, signOut, setupRole, refreshToken } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { signUpSchema,loginSchema } from "../validations/auth.schema";
import { getUserNotifications, markNotificationsRead } from "../controllers/notification.controller";
import { sendEmailOtp, verifyEmailOtp } from "../controllers/verifications.controller";
const router = Router();


router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), signIn);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);
router.patch("/setup-role", protect, setupRole);
router.get("/notifications", protect, getUserNotifications);
router.patch("/notifications", protect, markNotificationsRead);
router.post("/logout", protect, signOut);
router.post("/auth/send-email-otp", sendEmailOtp);
router.post("/auth/verify-email", verifyEmailOtp);

export default router;