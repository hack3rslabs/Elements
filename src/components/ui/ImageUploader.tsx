"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle, Loader2, Link2 } from "lucide-react";

const API = "";
const HEADERS_AUTH = { "x-api-key": "elements-admin-key-2026" };

interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

interface ImageUploaderProps {
  /** Current image URL value */
  value: string;
  /** Called when the URL changes (upload success OR manual URL edit) */
  onChange: (url: string) => void;
  /** Label shown above the uploader */
  label?: string;
  /** Placeholder for the manual URL input */
  placeholder?: string;
  /** Whether this field is required */
  required?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Image",
  placeholder = "/images/products/photo.webp or https://...",
  required = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doUpload = useCallback(async (file: File) => {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(file.type)) {
      setUploadError("Only image files allowed (jpg, png, webp, gif, svg)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API}/api/admin/upload`, {
        method: "POST",
        headers: HEADERS_AUTH,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.message || `Upload failed (${res.status})`);
        return;
      }

      const uploaded: UploadedFile = data.data;
      onChange(uploaded.url);
      setUploadSuccess(`Uploaded: ${uploaded.originalName} (${(uploaded.size / 1024).toFixed(0)} KB)`);
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(
        error?.message?.includes("fetch") || error?.name === "TypeError"
          ? "Cannot connect to backend. Make sure the server is running."
          : `Upload failed: ${error?.message || "Unknown error"}`
      );
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const clearImage = () => {
    onChange("");
    setUploadSuccess("");
    setUploadError("");
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {/* Mode toggle */}
        <div className="flex rounded-lg border overflow-hidden text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
              mode === "upload" ? "bg-[#1877F2] text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Upload className="h-3 w-3" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
              mode === "url" ? "bg-[#1877F2] text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Link2 className="h-3 w-3" /> Paste URL
          </button>
        </div>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
            dragging
              ? "border-[#1877F2] bg-blue-50 scale-[1.01]"
              : uploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-200 hover:border-[#1877F2] hover:bg-blue-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {/* Preview if image exists */}
          {value && !uploading ? (
            <div className="relative h-32 rounded-xl overflow-hidden group">
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-medium">Click or drop to replace</span>
              </div>
              {/* Clear button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center py-7 gap-2">
              <Loader2 className="h-7 w-7 text-[#1877F2] animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-7 gap-2 text-gray-400">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? "bg-[#1877F2] text-white" : "bg-gray-100"}`}>
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600">
                  {dragging ? "Drop to upload" : "Click to upload or drag & drop"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP, GIF, SVG — max 5 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setUploadError(""); setUploadSuccess(""); }}
            className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none font-mono"
            placeholder={placeholder}
          />
          {value && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 h-28">
              <Image
                src={value}
                alt="URL preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL display after upload */}
      {value && mode === "upload" && (
        <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 border">
          <ImageIcon className="h-3 w-3 shrink-0 text-[#1877F2]" />
          <span className="font-mono truncate flex-1">{value}</span>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(value); }}
            className="text-[#1877F2] hover:underline shrink-0 font-medium"
            title="Copy URL"
          >
            Copy
          </button>
        </div>
      )}

      {/* Status messages */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
      {uploadError && (
        <div className="flex items-center gap-2 text-[11px] text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}

