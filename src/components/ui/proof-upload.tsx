"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { toast } from "sonner";

type ProofInfo = {
  type: Database["public"]["Enums"]["ProofType"];
  content: string;
  status?: Database["public"]["Enums"]["ProofStatus"];
  reviewedAt?: string | null;
};

interface ProofUploadProps {
  platform: string;
  existingProofs: ProofInfo[];
  selectedProofs: ProofInfo[];
  proofUrls: Record<string, string>;
  onProofAdd: (type: Database["public"]["Enums"]["ProofType"], content: string) => void;
  onProofRemove: (index: number) => void;
}

export function ProofUpload({
  platform,
  existingProofs,
  selectedProofs,
  proofUrls,
  onProofAdd,
  onProofRemove
}: ProofUploadProps) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Check if we already have a proof of a specific type (either existing or selected)
  const hasProofType = (type: Database["public"]["Enums"]["ProofType"]) => {
    return existingProofs.some(p => p.type === type) || 
           selectedProofs.some(p => p.type === type);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (hasProofType('URL')) {
      setError("You can only add one URL proof");
      return;
    }

    try {
      new URL(url); // Validate URL format
      onProofAdd('URL', url);
      setUrl("");
      setError(null);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (hasProofType('IMAGE')) {
      setError("You can only add one image proof");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onProofAdd('IMAGE', reader.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError("Failed to process image");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* URL Proof Input */}
        <div className="space-y-2">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter proof URL"
              disabled={hasProofType('URL')}
              className="flex-1 px-3 py-2 border rounded-md bg-transparent"
            />
            <Button 
              type="submit" 
              variant="outline"
              disabled={hasProofType('URL')}
            >
              Add URL
            </Button>
          </form>
        </div>

        {/* Image Upload */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={hasProofType('IMAGE')}
            className="hidden"
            id={`image-upload-${platform}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`image-upload-${platform}`)?.click()}
            className="w-full border-dashed"
            disabled={hasProofType('IMAGE')}
          >
            Upload Images
          </Button>
        </div>
      </div>

      {/* Display existing proofs */}
      {existingProofs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Existing Proofs</h4>
          <div className="grid gap-2">
            {existingProofs.map((proof, index) => (
              <div key={index} className="p-2 border rounded flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {proof.type === 'URL' ? '🔗 URL' : '📷 Image'}
                  </span>
                  {proof.type === 'URL' ? (
                    <a 
                      href={proof.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    proofUrls[proof.content] && (
                      <a 
                        href={proofUrls[proof.content]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Image
                      </a>
                    )
                  )}
                </div>
                <Badge variant={
                  proof.status === 'ACCEPTED' ? 'success' :
                  proof.status === 'REJECTED' ? 'destructive' :
                  'outline'
                }>
                  {proof.status || 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display selected proofs */}
      {selectedProofs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Proofs</h4>
          <div className="grid gap-2">
            {selectedProofs.map((proof, index) => (
              <div key={index} className="p-2 border rounded flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {proof.type === 'URL' ? '🔗 URL' : '📷 Image'}
                  </span>
                  {proof.type === 'URL' ? (
                    <a 
                      href={proof.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Image selected
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onProofRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}