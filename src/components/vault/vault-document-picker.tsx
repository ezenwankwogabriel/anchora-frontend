"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { usePlan } from "@/hooks/usePlan";

const ACCEPTED_MIMES = "image/jpeg,image/png,application/pdf";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — courtesy check, server is the real gate
const FREE_DOCUMENT_LIMIT = 1;
const PRO_DOCUMENT_LIMIT = 3;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface VaultDocumentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

// Staged, not-yet-uploaded documents for the create-asset flow — the record
// doesn't exist yet, so nothing is sent to the backend here. The parent
// uploads these files right after the record is created, as part of the
// same "Save asset" action.
export function VaultDocumentPicker({ files, onChange }: VaultDocumentPickerProps) {
  const addToast = useToastStore((s) => s.add);
  const { isFree } = usePlan();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const limit = isFree ? FREE_DOCUMENT_LIMIT : PRO_DOCUMENT_LIMIT;
  const atLimit = files.length >= limit;

  const addFile = (file: File) => {
    if (atLimit) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      addToast("Only JPG, PNG or PDF files are accepted.", "error");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      addToast("File must be under 10 MB.", "error");
      return;
    }
    onChange([...files, file]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6">
      <label className="block text-[12.5px] font-semibold text-text-secondary mb-[6px] tracking-[0.02em]">
        Documents
      </label>

      {files.length > 0 && (
        <ul className="space-y-2 mb-3">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-text-primary truncate">Document {i + 1}</p>
                  <p className="text-[11.5px] text-text-tertiary">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-text-tertiary hover:text-red cursor-pointer bg-transparent border-none flex-shrink-0"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!atLimit && (
        <>
          <div
            className={`border-2 border-dashed rounded-xl p-5 bg-gray-50 text-center cursor-pointer transition-colors ${
              dragOver ? "border-navy bg-navy/5" : "border-gray-300 hover:border-navy"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) addFile(file);
            }}
          >
            <Upload size={20} className="text-gray-400 mx-auto" />
            <p className="text-[12.5px] text-text-secondary mt-1.5">
              Click to upload or drag and drop
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">JPG, PNG or PDF · Max 10MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIMES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addFile(file);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </>
      )}

      <p className="text-[11px] text-text-tertiary mt-2">
        {files.length} of {limit} document{limit === 1 ? "" : "s"} — attach a photo or scan of
        the source document, if you have one.
      </p>
    </div>
  );
}
