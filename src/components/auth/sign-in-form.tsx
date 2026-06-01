"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FancyText } from "@/components/ui/fancy-text";
import { IconBrandGoogle } from "@tabler/icons-react";

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

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.removeItem("setup-storage");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.hasProfile) {
      router.replace("/dashboard");
    } else {
      router.replace("/setup");
    }
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
          Welcome <FancyText>back</FancyText>
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your credentials to sign in to your account
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
            />
            <BottomGradient />
          </div>
        </LabelInputContainer>
        <button
          className="group/btn relative block h-11 w-full rounded-md bg-gradient-to-br from-pink-500 to-pink-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:from-pink-600 dark:to-pink-800"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
          <BottomGradient />
        </button>
      </form>

      <div className="bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent my-6 h-[1px] w-full" />

      <div className="flex flex-col gap-4">
        <button
          className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full rounded-md h-11 font-medium bg-pink-50 border border-pink-100 hover:bg-pink-100 text-pink-700 transition duration-200 cursor-pointer shadow-sm"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <IconBrandGoogle className="h-4 w-4 text-pink-600" />
          <span className="text-pink-700 text-sm font-semibold">
            {loading ? "Connecting..." : "Continue with Google"}
          </span>
          <BottomGradient />
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={() => router.push("/auth/signup")}
          className="text-pink-500 hover:text-pink-600 font-medium underline-offset-4 hover:underline"
        >
          Sign up
        </button>
      </p>
      
    </div>
  );
}
