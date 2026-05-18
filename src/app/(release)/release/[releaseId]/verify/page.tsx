"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, UploadCloud, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { ReleaseService } from "@/services/release.service";
import { useAuthStore } from "@/stores/authStore";
import { useReleaseAuth } from "@/hooks/useReleaseAuth";
import { ServiceError } from "@/lib/types";

const ACCEPT = ".jpg,.jpeg,.png,.pdf";
const MAX_MB = 10;

function FileDropZone({
  label,
  required,
  file,
  onFile,
  onClear,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    onFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
        {label}{required && " *"}
      </label>

      {file ? (
        <div className="flex items-center gap-3 border border-border-color rounded-md px-4 py-3 bg-surface-2">
          <FileText size={16} className="text-accent flex-shrink-0" />
          <p className="text-[13px] text-text-primary flex-1 truncate">{file.name}</p>
          <button
            type="button"
            onClick={onClear}
            className="text-text-tertiary hover:text-red transition-colors bg-transparent border-none cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full border-2 border-dashed rounded-md px-4 py-6 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
            dragOver
              ? "border-accent bg-accent-light"
              : "border-border-color bg-surface hover:border-accent hover:bg-accent-light"
          }`}
        >
          <UploadCloud size={22} className="text-text-tertiary" />
          <p className="text-[13px] text-text-secondary">
            Drag & drop or <span className="text-accent">browse</span>
          </p>
          <p className="text-[11.5px] text-text-tertiary">JPG, PNG or PDF — max {MAX_MB}MB</p>
        </button>
      )}

      {sizeError && (
        <p className="text-[11.5px] text-red mt-[5px]">File must be under {MAX_MB}MB</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function ReleaseVerifyPage() {
  const params      = useParams();
  const router      = useRouter();
  const releaseId   = params.releaseId as string;
  const user        = useAuthStore((s) => s.user);
  const isAuth      = useReleaseAuth(releaseId);

  const [name, setName]               = useState(
    user ? `${user.firstName} ${user.lastName}` : ""
  );
  const [primaryDoc, setPrimaryDoc]   = useState<File | null>(null);
  const [supportDoc, setSupportDoc]   = useState<File | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  if (!isAuth) return null;

  const canSubmit = !!name.trim() && !!primaryDoc && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("primaryId", primaryDoc!);
    if (supportDoc) formData.append("supportingDoc", supportDoc);

    setLoading(true);
    setError(null);
    try {
      await ReleaseService.submitVerification(releaseId, formData);
      router.push(`/release/${releaseId}/confirmed`);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-color p-8">
      <h1 className="font-heading text-[26px] text-text-primary mb-2">
        Verify your identity to continue
      </h1>
      <p className="text-[13.5px] text-text-secondary mb-7 leading-relaxed">
        Upload a government-issued ID to confirm your identity before accessing the release report.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormSection>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
            Full name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="As it appears on your ID"
          />
        </FormSection>

        <FormSection>
          <FileDropZone
            label="Primary ID document"
            required
            file={primaryDoc}
            onFile={setPrimaryDoc}
            onClear={() => setPrimaryDoc(null)}
          />
        </FormSection>

        <FormSection>
          <FileDropZone
            label="Supporting document (optional)"
            file={supportDoc}
            onFile={setSupportDoc}
            onClear={() => setSupportDoc(null)}
          />
        </FormSection>

        {error && (
          <p className="text-[12.5px] text-red bg-red-light border border-[#F5B0B0] rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={!canSubmit}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          Submit verification →
        </Button>
      </form>
    </div>
  );
}
