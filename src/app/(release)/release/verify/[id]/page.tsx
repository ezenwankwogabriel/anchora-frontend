"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Upload, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReleaseService } from "@/services/release.service";
import { useToastStore } from "@/stores/toastStore";

function Step({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
        active ? "bg-navy text-white" : "bg-gray-200 text-gray-500"
      }`}>
        {active ? "1" : "2"}
      </div>
      <span className={`text-[13px] font-[500] ${active ? "text-text-primary" : "text-text-tertiary"}`}>
        {label}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VerifyIdentityPage() {
  const { id } = useParams<{ id: string }>();
  const addToast = useToastStore((s) => s.add);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      addToast("File must be under 5 MB.", "error");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleRemove = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("document", file);
      await ReleaseService.submitVerification(id, fd);
      setSubmitted(true);
    } catch {
      addToast("Failed to submit. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <h1 className="font-heading text-2xl text-text-primary">Verify your identity</h1>
      <p className="text-[13.5px] text-text-secondary mt-2">
        To access the estate report, confirm your identity. This ensures only the designated
        executor can access it.
      </p>

      {/* Progress */}
      <div className="flex items-center gap-4 mt-6 mb-8">
        <Step label="Verify identity" active={true} />
        <div className="flex-1 h-px bg-gray-200" />
        <Step label="Access report" active={false} />
      </div>

      {/* Upload card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <p className="font-semibold text-[15px] text-text-primary">Upload identity document</p>
        <p className="text-[13px] text-text-secondary mt-1">
          A clear photo or scan of a valid government-issued ID.
        </p>

        {!submitted ? (
          <>
            <ul className="mt-3 space-y-1 text-[13px] text-text-secondary">
              {["National ID Card (NIN)", "International Passport", "Driver's Licence", "Voter's Card"].map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>

            <div
              className={`mt-4 border-2 border-dashed rounded-xl p-8 bg-gray-50 text-center cursor-pointer transition-colors ${
                dragOver ? "border-navy bg-navy/5" : "border-gray-300 hover:border-navy"
              }`}
              onClick={() => !file && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                preview ? (
                  <div className="flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="ID preview" className="max-h-40 rounded-lg object-contain" />
                    <p className="text-[12px] text-text-secondary">{file.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                      className="text-[12px] text-red flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      <X size={13} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[13px] font-medium text-text-primary">{file.name}</p>
                    <p className="text-[12px] text-text-secondary">{formatBytes(file.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                      className="text-[12px] text-red flex items-center gap-1 mt-1 cursor-pointer bg-transparent border-none"
                    >
                      <X size={13} /> Remove
                    </button>
                  </div>
                )
              ) : (
                <>
                  <Upload size={32} className="text-gray-400 mx-auto" />
                  <p className="text-[13px] text-text-secondary mt-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-1">
                    JPG, PNG or PDF · Max 5MB
                  </p>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            <Button
              fullWidth
              className="mt-6"
              disabled={!file || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit for verification"}
            </Button>
          </>
        ) : (
          <div className="mt-6 text-center py-6">
            <Clock size={40} className="text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-[14px] text-text-primary">Verification submitted</p>
            <p className="text-[13px] text-text-secondary mt-2">
              Your documents are being reviewed. This usually takes 1–2 business days.
              You&apos;ll receive an email when complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
