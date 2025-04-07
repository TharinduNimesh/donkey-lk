"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetupStore } from "@/lib/store";

interface UserTypeFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function UserTypeForm({ onNext, onBack }: UserTypeFormProps) {
  const { setUserType } = useSetupStore();

  const handleSelect = (type: "brand" | "influencer") => {
    setUserType(type);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Choose Your Role</h2>
        <p className="text-sm text-muted-foreground">
          Select how you want to use donkey.lk
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="p-6 cursor-pointer hover:border-purple-600 transition-colors"
          onClick={() => handleSelect("brand")}
        >
          <div className="space-y-4">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">I'm a Brand</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Looking to connect with content creators for promotions
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-purple-600 transition-colors"
          onClick={() => handleSelect("influencer")}
        >
          <div className="space-y-4">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">I'm an Influencer</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Looking to monetize my content and work with brands
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}