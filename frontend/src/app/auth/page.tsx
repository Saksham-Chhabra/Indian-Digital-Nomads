"use client";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "CLIENT" | "FREELANCER" | "ADMIN" | "SUPPORT"; // Added ADMIN/SUPPORT to type safety matches

interface FieldErrors {
  [field: string]: string;
}

function parseBackendError(err: any): { general: string; fields: FieldErrors } {
  const data = err?.response?.data;
  if (!data)
    return { general: "Network error. Is the server running?", fields: {} };

  if (Array.isArray(data.errors)) {
    const fields: FieldErrors = {};
    data.errors.forEach((e: { field: string | number; message: string }) => {
      fields[String(e.field)] = e.message;
    });
    return { general: "Please fix the errors below.", fields };
  }

  if (data.error) return { general: data.error, fields: {} };

  // Fallback
  return {
    general: data.message || "Something went wrong. Please try again.",
    fields: {},
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("CLIENT"); // Maintained original hook role state type limits
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  // 2. Destructure 'user' and 'loading' from your AuthContext
  const { user, loading: authLoading, refreshUser, login } = useAuthContext();
  const router = useRouter();

  // 3. BACK BUTTON GUARD: Automatically forward logged-in users away from the login page
  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role;
      if (userRole === 'ADMIN' ) {
        router.replace('/admin');
      } else if (userRole === 'CLIENT') {
        router.replace('/client');
      } else if (userRole === 'FREELANCER') {
        router.replace('/freelancer');
      }
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = () => {
    if (isLogin) {
      window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`;
    } else {
      window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google?role=${role}`;
    }
  };

  const clearErrors = () => {
    setGeneralError("");
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    const endpoint = isLogin ? "/api/v1/user/login" : "/api/v1/user/signup";

    try {
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            role,
          };

      const response = await api.post(endpoint, payload);
      const userData = response.data.user;
      const userRole: Role = userData?.role; 

      // Store tokens and set user state in one step via context
      if (response.data.accessToken && response.data.refreshToken) {
        login(
          { accessToken: response.data.accessToken, refreshToken: response.data.refreshToken },
          userData
        );
      }

      // --->  REDIRECTION BASED ON ROLE <---
      if (userRole === "ADMIN" || userRole === "SUPPORT") {
        router.push("/admin");
      } else if (userRole === "CLIENT") {
        router.push("/client");
      } else if (userRole === "FREELANCER") {
        router.push("/freelancer");
      } else {
        // Fallback to state role if backend doesn't provide it
        router.push(role === "CLIENT" ? "/client" : "/freelancer");
      }
    } catch (err: any) {
      const { general, fields } = parseBackendError(err);
      setGeneralError(general);
      setFieldErrors(fields);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearErrors();
    setFormData({ email: "", password: "", fullName: "" });
  };

  // 4. Prevent a brief UI layout flash of the form while determining if the user is authenticated
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <p className="text-slate-500 font-medium">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-outline-variant/10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-blue-700 tracking-tighter">
            LocalGigs
          </span>
          <h2 className="text-xl font-bold mt-4 font-headline">
            {isLogin ? "Welcome Back" : "Join the Neighborhood"}
          </h2>
        </div>

        {/* General error banner */}
        {generalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name — signup only */}
          {!isLogin && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                className={`w-full p-3 mt-1 bg-surface-container-low rounded-xl border focus:ring-2 focus:ring-primary outline-none ${
                  fieldErrors.fullName ? "border-red-400" : "border-transparent"
                }`}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Email Address
            </label>
            <input
              type="email" 
              placeholder="name@example.com"
              value={formData.email}
              className={`w-full p-3 mt-1 bg-surface-container-low rounded-xl border focus:ring-2 focus:ring-primary outline-none ${
                fieldErrors.email ? "border-red-400" : "border-transparent"
              }`}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              className={`w-full p-3 mt-1 bg-surface-container-low rounded-xl border focus:ring-2 focus:ring-primary outline-none ${
                fieldErrors.password ? "border-red-400" : "border-transparent"
              }`}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-500">
                {fieldErrors.password}
              </p>
            ) : !isLogin ? (
              <p className="mt-1 text-xs text-slate-400">
                Must be at least 8 characters
              </p>
            ) : null}
          </div>

          {/* Role picker — signup only */}
          {!isLogin && (
            <div className="py-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                I want to...
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    role === "CLIENT"
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  Hire Talent
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FREELANCER")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    role === "FREELANCER"
                      ? "bg-secondary text-white border-secondary"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  Work Gigs
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 text-center">
          <hr className="border-slate-100" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            OR
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 flex items-center justify-center gap-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="w-4 h-4"
            alt="google"
          />
          Continue with Google
        </button>

        {/* Switch mode */}
        <p className="text-center mt-8 text-sm text-slate-500">
          {isLogin ? "New to LocalGigs?" : "Already have an account?"}
          <button
            onClick={switchMode}
            className="ml-2 text-primary font-bold hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
