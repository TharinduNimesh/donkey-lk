"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminProofsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Application Proofs</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Proof Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Influencer task completion proof verification system will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}