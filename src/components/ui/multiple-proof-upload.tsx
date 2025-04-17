"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { toast } from "sonner";

type Platform = Database["public"]["Enums"]["Platforms"];
type ProofType = Database["public"]["Enums"]["ProofType"];
type ProofStatus = Database["public"]["Enums"]["ProofStatus"];

interface ExistingProof {
  type: ProofType;
  content: string;
  status?: ProofStatus;
  reviewedAt?: string | null;
}

interface ProofUploadProps {
  platform: Platform;
  existingProofs?: ExistingProof[];
  onProofAdd: (type: ProofType, content: string) => void;
  onProofRemove: (index: number) => void;
  proofUrls?: Record<string, string>;
  selectedProofs?: Array<{
    type: ProofType;
    content: string;
  }>;
  className?: string;
}

export function MultipleProofUpload({
  platform,
  existingProofs = [],
  onProofAdd,
  onProofRemove,
  proofUrls = {},
  selectedProofs = [],
  className,
}: ProofUploadProps) {
  const [inputUrl, setInputUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    try {
      new URL(inputUrl); // Validate URL format
      onProofAdd("URL", inputUrl);
      setInputUrl("");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Preserve the MIME type in the base64 string
          const base64String = `data:${file.type};base64,${(reader.result as string).split(',')[1]}`;
          onProofAdd("IMAGE", base64String);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please upload only image files");
      }
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Display existing proofs */}
      {existingProofs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Submitted Proofs:</h4>
          <div className="grid gap-2">
            {existingProofs.map((proof, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium">{proof.type}:</span>
                  {proof.type === "URL" ? (
                    <a
                      href={proof.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    <div className="relative group cursor-pointer">
                      <span className="text-sm text-blue-600 hover:underline">View Image</span>
                      <div className="hidden group-hover:block absolute z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl -translate-y-full bottom-full left-0">
                        <img
                          src={proofUrls[proof.content]}
                          alt="Proof"
                          className="max-w-[300px] max-h-[300px] rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {proof.status && (
                  <Badge
                    variant={
                      proof.status === "ACCEPTED"
                        ? "success"
                        : proof.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {proof.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New proofs being added */}
      {selectedProofs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">New Proofs:</h4>
          <div className="grid gap-2">
            {selectedProofs.map((proof, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{proof.type}:</span>
                  {proof.type === "URL" ? (
                    <span className="text-sm truncate max-w-[200px]">{proof.content}</span>
                  ) : (
                    <div className="relative group cursor-pointer">
                      <span className="text-sm text-blue-600 hover:underline">Preview Image</span>
                      <div className="hidden group-hover:block absolute z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl -translate-y-full bottom-full left-0">
                        <img
                          src={proof.content}
                          alt="Preview"
                          className="max-w-[300px] max-h-[300px] rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onProofRemove(index)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Input */}
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter URL proof"
          className="flex-1 px-3 py-2 border rounded-md bg-transparent"
        />
        <Button type="submit" variant="outline" disabled={!inputUrl}>
          Add URL
        </Button>
      </form>

      {/* Image Upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id={`image-upload-${platform}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-dashed"
        >
          Upload Images
        </Button>
      </div>
    </div>
  );
}