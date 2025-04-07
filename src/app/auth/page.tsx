"use client";

import { useState } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.png" alt="donkey.lk" className="h-8 mr-2" />
          donkey.lk
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "donkey.lk has completely transformed how I monetize my content. The local focus really makes a difference!"
            </p>
            <footer className="text-sm">Sofia Perera</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex flex-col justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isSignIn ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignIn 
                ? "Enter your email to sign in to your account" 
                : "Enter your email to create your account"}
            </p>
          </div>
          {isSignIn ? <SignInForm /> : <SignUpForm />}
          <div className="text-center text-sm">
            {isSignIn ? (
              <p>
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="underline" 
                  onClick={() => setIsSignIn(false)}
                >
                  Sign up
                </Button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="underline" 
                  onClick={() => setIsSignIn(true)}
                >
                  Sign in
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}