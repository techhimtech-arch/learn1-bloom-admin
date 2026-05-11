import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadApi } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: any) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  className?: string;
  previewUrl?: string;
  uploadType?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  accept = "image/*,application/pdf,.doc,.docx",
  maxSize = 5,
  label = "Upload File",
  className,
  previewUrl,
  uploadType = "general",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`File size should be less than ${maxSize}MB`);
      return;
    }
    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Simulate progress since axios basic doesn't give it easily without extra config
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadApi.uploadFile(fileToUpload, uploadType);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const url = response.data.data?.url || response.data.url;
      if (url) {
        onUploadSuccess(url);
        toast.success("File uploaded successfully");
      } else {
        throw new Error("URL not found in response");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload file");
      onUploadError?.(error);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative group border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4",
          isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept={accept}
        />

        {file || previewUrl ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative h-24 w-24 rounded-lg overflow-hidden border bg-background shadow-sm">
              {(file && isImage(file.name)) || (previewUrl && isImage(previewUrl)) ? (
                <img
                  src={file ? URL.createObjectURL(file) : previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              {file && !isUploading && (
                <button
                  onClick={clearFile}
                  className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full shadow-sm transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {file ? file.name : "Current File"}
              </p>
              <p className="text-xs text-muted-foreground">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Uploaded"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
              <Upload className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-semibold">{label}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Maximum size: {maxSize}MB
              </p>
            </div>
          </>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <div className="w-full max-w-[180px] space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs font-medium text-center text-primary">
                Uploading... {uploadProgress}%
              </p>
            </div>
          </div>
        )}

        {uploadProgress === 100 && !isUploading && file && (
          <div className="absolute top-2 right-2 text-green-500 animate-in zoom-in duration-300">
            <CheckCircle2 className="h-6 w-6 fill-current" />
          </div>
        )}
      </div>
    </div>
  );
};
