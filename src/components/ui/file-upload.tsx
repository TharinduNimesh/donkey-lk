"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onFileSelect: (file: File | null) => void
  selectedFile?: File | null
}

export function FileUpload({ 
  className,
  onFileSelect,
  selectedFile,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleClear = () => {
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background/80 transition-colors",
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !selectedFile && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        {...props}
      />
      
      {selectedFile ? (
        <div className="flex items-center gap-2 p-4">
          <span className="text-sm">{selectedFile.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="p-1 hover:bg-background rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, MOV up to 100MB
          </p>
        </div>
      )}
    </div>
  )
}