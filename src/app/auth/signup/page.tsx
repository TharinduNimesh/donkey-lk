"use client";

import { SignUpForm } from "@/components/auth/sign-up-form";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("referral") || undefined;

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
    <div className="lg:order-first p-4 lg:p-8 h-full flex flex-col justify-center">
      <div className="mx-auto flex w-full flex-col justify-center sm:w-[450px]">
        <SignUpForm referralCode={referralCode} />
      </div>
    </div>
  );
}