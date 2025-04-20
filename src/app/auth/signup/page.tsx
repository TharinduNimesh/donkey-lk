"use client";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="lg:order-first p-4 lg:p-8 h-full flex flex-col justify-center">
      <div className="mx-auto flex w-full flex-col justify-center sm:w-[450px]">
        <SignUpForm />
      </div>
    </div>
  );
}