"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminVerificationsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ownership Verifications</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Platform Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Social media platform ownership verification management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}