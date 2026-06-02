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
  maxSize?: number; // in bytes
}

export function ProofUpload({
  platform,
  existingProofs,
  selectedProofs,
  proofUrls,
  onProofAdd,
  onProofRemove,
  maxSize = 5 * 1024 * 1024 // Default 5MB
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

    if (file.size > maxSize) {
      // Try to compress the image to fit under the maxSize before rejecting
      try {
        const compressed = await compressImage(file, maxSize);
        if (compressed.size > maxSize) {
          setError(`Image size should be less than ${Math.floor(maxSize / (1024 * 1024))}MB`);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onProofAdd('IMAGE', reader.result);
            setError(null);
          }
        };
        reader.readAsDataURL(compressed);
        return;
      } catch (err) {
        console.error('Image compression failed:', err);
        setError(`Image is too large and could not be compressed. Please upload a smaller image (< ${Math.floor(maxSize / (1024 * 1024))}MB).`);
        return;
      }
    }
    // If file size is within limits, just read it
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

  // Compress an image file to be under targetSize (bytes). Returns a Blob.
  const compressImage = async (file: File, targetSize: number): Promise<Blob> => {
    // Create an image bitmap for efficient rendering
    const imgBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');

    // Start with original dimensions, but cap max width/height to reduce size
    const MAX_DIM = 1920;
    let { width, height } = imgBitmap;
    if (width > MAX_DIM || height > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(imgBitmap, 0, 0, width, height);

    // Try different quality levels until under target size
    let quality = 0.9;
    const MIN_QUALITY = 0.4;
    while (quality >= MIN_QUALITY) {
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as any, 'image/jpeg', quality));
      if (!blob) break;
      if (blob.size <= targetSize) return blob;
      quality -= 0.1;
    }

    // If still too large, try reducing dimensions further
    let scale = 0.9;
    while (scale > 0.3) {
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(imgBitmap, 0, 0, w, h);
      let q = 0.85;
      while (q >= MIN_QUALITY) {
        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as any, 'image/jpeg', q));
        if (!blob) break;
        if (blob.size <= targetSize) return blob;
        q -= 0.1;
      }
      scale -= 0.1;
    }

    // Return the last generated blob (may still be larger than target)
    const finalBlob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as any, 'image/jpeg', MIN_QUALITY));
    if (!finalBlob) throw new Error('Failed to compress image');
    return finalBlob;
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-[11px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 p-2.5 rounded-md flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {/* URL Proof Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Proof URL Link</label>
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/your-post"
              disabled={hasProofType('URL')}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50/50 dark:disabled:bg-gray-900/10 h-9"
            />
            <Button 
              type="submit" 
              variant="outline"
              disabled={hasProofType('URL')}
              className="h-9 px-3 font-semibold text-xs rounded-lg border-gray-200 dark:border-gray-800 hover:bg-pink-50/30 hover:border-pink-200 dark:hover:bg-pink-950/15 dark:hover:border-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 shrink-0"
            >
              Add Link
            </Button>
          </form>
        </div>

        {/* Image Upload */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Screenshot Proof</label>
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
          <div className="flex flex-col h-[52px] justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(`image-upload-${platform}`)?.click()}
              className="w-full h-9 border-dashed border-2 border-gray-200 dark:border-gray-850 hover:border-pink-400 dark:hover:border-pink-800 hover:bg-pink-50/5 dark:hover:bg-pink-950/5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              disabled={hasProofType('IMAGE')}
            >
              Upload Screenshot Image
            </Button>
            <div className="text-[9px] text-muted-foreground leading-none">
              Image size must be less than {Math.floor(maxSize / (1024 * 1024))}MB.
            </div>
          </div>
        </div>
      </div>

      {/* Display existing proofs */}
      {existingProofs.length > 0 && (
        <div className="space-y-1.5 pt-1.5">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Uploaded Proofs</h4>
          <div className="grid gap-2">
            {existingProofs.map((proof, index) => (
              <div key={index} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-3xs flex items-center justify-between gap-2.5 text-xs hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[10px] shrink-0 select-none bg-gray-100 dark:bg-gray-850 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                    {proof.type === 'URL' ? '🔗 Link' : '📷 Image'}
                  </span>
                  {proof.type === 'URL' ? (
                    <a 
                      href={proof.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline truncate pr-1"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    proofUrls[proof.content] && (
                      <a 
                        href={proofUrls[proof.content]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline truncate"
                      >
                        View uploaded image
                      </a>
                    )
                  )}
                </div>
                <Badge className={`
                  font-bold text-[9px] px-2 py-0.5 rounded-full select-none shadow-3xs shrink-0 uppercase tracking-wider
                  ${proof.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : ''}
                  ${proof.status === 'REJECTED' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30' : ''}
                  ${!proof.status || proof.status === 'PENDING' ? 'bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border border-gray-100 dark:border-gray-800/60' : ''}
                `}>
                  {proof.status || 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display selected proofs */}
      {selectedProofs.length > 0 && (
        <div className="space-y-1.5 pt-1.5">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Ready to Submit</h4>
          <div className="grid gap-2">
            {selectedProofs.map((proof, index) => (
              <div key={index} className="p-2.5 rounded-lg border border-pink-100 dark:border-pink-900/30 bg-pink-50/5 dark:bg-pink-950/5 flex items-center justify-between gap-2.5 text-xs hover:border-pink-200 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[10px] shrink-0 select-none bg-pink-50 dark:bg-pink-950/20 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400">
                    {proof.type === 'URL' ? '🔗 Link' : '📷 Image'}
                  </span>
                  {proof.type === 'URL' ? (
                    <a 
                      href={proof.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline truncate pr-1"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      Screenshot image loaded
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onProofRemove(index)}
                  className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 shrink-0 flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}