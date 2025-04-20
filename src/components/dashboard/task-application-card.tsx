import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ViewsSelect } from "@/components/ui/views-select";
import { Database } from "@/types/database.types";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { toast } from "sonner";

type Platform = Database["public"]["Enums"]["Platforms"];
type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];

interface TaskApplicationCardProps {
  platform: Platform;
  targetViews: string;
  dueDate: string;
  verifiedProfiles: InfluencerProfile[];
  onViewsChange: (views: string) => void;
  selectedViews: string;
}

export function TaskApplicationCard({
  platform,
  targetViews,
  dueDate,
  verifiedProfiles,
  onViewsChange,
  selectedViews,
}: TaskApplicationCardProps) {
  const matchingProfile = verifiedProfiles.find(p => p.platform === platform);
  const maxViews = parseViewCount(targetViews);

  const handleViewsChange = (value: string) => {
    const parsedViews = parseViewCount(value);
    if (parsedViews > maxViews) {
      toast.error(`Cannot exceed target views of ${formatViewCount(maxViews)}`);
      return;
    }
    onViewsChange(value);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">{platform}</h3>
            <p className="text-sm text-muted-foreground">
              Target: {formatViewCount(maxViews)} views
            </p>
            <p className="text-sm text-muted-foreground">
              Due by: {new Date(dueDate).toLocaleDateString()}
            </p>
          </div>
          {matchingProfile ? (
            <Badge variant="success">Verified Profile</Badge>
          ) : (
            <Badge variant="destructive">Profile Not Verified</Badge>
          )}
        </div>

        {matchingProfile ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-1">Your Profile</p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{matchingProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatViewCount(parseViewCount(matchingProfile.followers))} followers
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>How many views can you deliver?</Label>
              <ViewsSelect
                value={selectedViews}
                onValueChange={handleViewsChange}
                data-max-views={maxViews}
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">
              You need a verified {platform} profile to apply
            </p>
            <Button variant="outline" className="w-full">
              Verify {platform} Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}