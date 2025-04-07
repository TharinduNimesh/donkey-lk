"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSetupStore } from "@/lib/store";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9+]{10,12}$/, "Invalid mobile number"),
});

interface PersonalInfoFormProps {
  onNext: () => void;
}

export function PersonalInfoForm({ onNext }: PersonalInfoFormProps) {
  const { setPersonalInfo, personalInfo } = useSetupStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: personalInfo?.name || "",
      mobile: personalInfo?.mobile || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setPersonalInfo(values);
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Please provide your basic information to continue
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+94XXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Continue</Button>
        </form>
      </Form>
    </div>
  );
}