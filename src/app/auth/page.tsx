"use client";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="p-4 lg:p-8 h-full flex flex-col justify-center">
      <div className="mx-auto flex w-full flex-col justify-center sm:w-[400px]">
        <SignInForm />
      </div>
    </div>
  );
}