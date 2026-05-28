"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { Suspense } from "react";
import api from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthContext();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const isNew = searchParams.get("isNew") === "true";
    const roleChosen = searchParams.get("roleChosen") === "true";

    if (!accessToken || !refreshToken) {
      // No tokens provided — redirect to login
      router.replace("/auth");
      return;
    }

    // Store tokens in localStorage first (so the api interceptor can use them)
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Determine where to redirect
    if (isNew && !roleChosen) {
      // For new users, fetch profile first to set context, then redirect to setup-role
      api.get("/api/v1/user/me")
        .then((res) => {
          if (res.data.success && res.data.data) {
            login({ accessToken, refreshToken }, res.data.data);
          }
          router.replace("/auth/setup-role");
        })
        .catch(() => {
          router.replace("/auth/setup-role");
        });
    } else {
      // Existing user — fetch profile to get role for redirect
      api.get("/api/v1/user/me")
        .then((res) => {
          if (res.data.success && res.data.data) {
            const userData = res.data.data;
            login({ accessToken, refreshToken }, userData);

            const role = userData.role;
            if (role === "ADMIN" || role === "SUPPORT") {
              router.replace("/admin");
            } else if (role === "CLIENT") {
              router.replace("/client");
            } else if (role === "FREELANCER") {
              router.replace("/freelancer");
            } else {
              router.replace("/client");
            }
          } else {
            router.replace("/auth");
          }
        })
        .catch(() => {
          router.replace("/auth");
        });
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface text-on-surface">
      <div
        className="w-12 h-12 rounded-full border-4 border-outline-variant border-t-primary animate-spin"
        aria-label="Completing sign in…"
        role="status"
      />
      <p className="text-sm text-on-surface-variant font-medium">
        Completing sign in…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="w-12 h-12 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
