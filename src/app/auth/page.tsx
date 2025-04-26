"use client";

import { SignInForm } from "@/components/auth/sign-in-form";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignInPage() {
  const router = useRouter();
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col justify-center">
      <div className="mx-auto flex w-full flex-col justify-center sm:w-[400px]">
        <SignInForm />
      </div>
    </div>
  );
}