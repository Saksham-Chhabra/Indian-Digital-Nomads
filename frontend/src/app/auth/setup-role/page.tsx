"use client";
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SetupRolePage() {
  const { user, refreshUser, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // If the user role is already set and we are not loading, redirect them to their respective dashboard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User not logged in, send them back to login page
        router.push('/auth');
      } else if (user.role === 'CLIENT' || user.role === 'FREELANCER') {
        // If they already have their role, redirect appropriately (if they just signed up, they shouldn't be stuck here)
        // Wait, they will only be sent here if the callback explicitly routed them here.
      }
    }
  }, [user, authLoading, router]);

  const handleRoleSelection = async (selectedRole: 'CLIENT' | 'FREELANCER') => {
    setLoading(true);
    setError('');
    try {
      await api.patch('/api/v1/user/setup-role', { role: selectedRole });
      await refreshUser();
      
      if (selectedRole === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/freelancer');
      }
    } catch (err: any) {
      console.error("Failed to setup role:", err);
      setError(err?.response?.data?.error || 'Failed to update your account type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-6 text-white">
      {/* Dynamic background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center"
      >
        <span className="text-sm font-bold tracking-widest text-blue-400 uppercase">Step 1 of 2</span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          How will you use LocalGigs?
        </h1>
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm md:text-base">
          Choose your account type. You can build projects and hire student talent, or work on local projects and grow your skills.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client option card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelection('CLIENT')}
            disabled={loading}
            className="flex flex-col items-center p-8 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/50 transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors mb-2">
              Join as a Client
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              I want to post gigs, hire local student talent, and complete my projects.
            </p>
          </motion.button>

          {/* Freelancer option card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelection('FREELANCER')}
            disabled={loading}
            className="flex flex-col items-center p-8 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/50 transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2">
              Join as a Freelancer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              I want to work on student projects, find local tasks, and earn money.
            </p>
          </motion.button>
        </div>

        {loading && (
          <div className="mt-8 text-sm text-slate-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
            Creating your account...
          </div>
        )}
      </motion.div>
    </div>
  );
}
