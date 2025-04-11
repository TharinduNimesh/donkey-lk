"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onFileSelect: (file: File | null) => void
  selectedFile?: File | null
  maxSize?: number // in bytes
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export function FileUpload({ 
  className,
  onFileSelect,
  selectedFile,
  maxSize = DEFAULT_MAX_SIZE,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string>("")

  const validateAndSelectFile = (file: File) => {
    setError("")
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.floor(maxSize / (1024 * 1024))}MB`)
      return false
    }
    return true
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (validateAndSelectFile(files[0])) {
        onFileSelect(files[0])
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      if (validateAndSelectFile(files[0])) {
        onFileSelect(files[0])
      }
    }
  }

  const handleClear = () => {
    onFileSelect(null)
    setError("")
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background/80 transition-colors",
          error && "border-red-500",
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
            <span className="text-xs text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
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
              Any file up to {Math.floor(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}