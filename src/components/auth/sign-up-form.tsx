"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp, signInWithGoogle } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FancyText } from "@/components/ui/fancy-text";

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
    </>
  );
};

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function SignUpForm({ referralCode }: { referralCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Remove old setup-storage (legacy)
    localStorage.removeItem("setup-storage");
    // Referral code handling
    const url = new URL(window.location.href);
    const referral = url.searchParams.get("referral") || url.searchParams.get("ref") || undefined;
    if (referral) {
      // Optionally validate referral here
      localStorage.setItem("referral_code", referral);
    } else {
      localStorage.removeItem("referral_code");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Referral code is now handled in Setup page after sign in.
    // No longer storing referral after sign up here.

    router.push("/auth?message=Check your email to confirm your account");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="shadow-input w-full rounded-2xl bg-white/90 dark:bg-black/80 backdrop-blur-lg p-4 md:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold tracking-tight">
          Start Your <FancyText>Journey</FancyText>
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Join BrandSync to unlock endless opportunities
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-500 dark:text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <LabelInputContainer>
          <Label htmlFor="email">Email</Label>
          <div className="group/input relative">
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="hello@brandsync.com"
            />
            <BottomGradient />
          </div>
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="password">Password</Label>
          <div className="group/input relative">
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
            />
            <BottomGradient />
          </div>
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="group/input relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
            />
            <BottomGradient />
          </div>
        </LabelInputContainer>
        <button
          className="group/btn relative block h-11 w-full rounded-md bg-gradient-to-br from-pink-500 to-pink-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:from-pink-600 dark:to-pink-800"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign up"}
          <BottomGradient />
        </button>
      </form>

      <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

      <button
        className="group/btn shadow-input relative flex h-11 w-full items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:text-white dark:shadow-[0px_0px_1px_1px_#262626] transition-all duration-300 hover:shadow-md dark:hover:bg-zinc-800"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Continue with Google</span>
        <BottomGradient />
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/auth")}
          className="text-pink-500 hover:text-pink-600 font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
