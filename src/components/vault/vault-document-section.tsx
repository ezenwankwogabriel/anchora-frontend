"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, FileText, Eye, Trash2, Clock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { VaultService } from "@/services/vault.service";
import { useToastStore } from "@/stores/toastStore";
import { usePlan } from "@/hooks/usePlan";
import type { VaultDocument } from "@/lib/types";

const ACCEPTED_MIMES = "image/jpeg,image/png,application/pdf";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — courtesy check, server is the real gate
const FREE_DOCUMENT_LIMIT = 1;
const PRO_DOCUMENT_LIMIT = 3;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface VaultDocumentSectionProps {
  recordId: string;
  // Newly picked documents are staged here, not uploaded — the parent
  // uploads them only after the record edit itself is saved, so document
  // attachment follows the same "nothing persists until Save" model as
  // every other field on this page.
  stagedFiles: File[];
  onStagedFilesChange: (files: File[]) => void;
  // Some older records may still have a "Document location URL" saved from
  // before upload existed — that field is retired for new use (upload is
  // the only path now), but an existing value is surfaced read-only here
  // rather than silently hidden, with the option to clear it.
  documentUrl?: string;
  onDocumentUrlChange?: (url: string) => void;
  // Fired once, after the existing-documents fetch resolves, so a parent
  // that keeps this section collapsed by default (e.g. inside an "Add more
  // details" disclosure) can auto-expand when there's something to show.
  onDocumentsLoaded?: (hasDocuments: boolean) => void;
}

export function VaultDocumentSection({
  recordId,
  stagedFiles,
  onStagedFilesChange,
  documentUrl,
  onDocumentUrlChange,
  onDocumentsLoaded,
}: VaultDocumentSectionProps) {
  const addToast = useToastStore((s) => s.add);
  const { isFree } = usePlan();

  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    VaultService.getDocuments(recordId)
      .then((data) => {
        setDocuments(data ?? []);
        onDocumentsLoaded?.((data ?? []).length > 0);
      })
      .finally(() => setLoading(false));
    // onDocumentsLoaded is a callback the parent should keep stable; only
    // recordId should re-trigger this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const limit = isFree ? FREE_DOCUMENT_LIMIT : PRO_DOCUMENT_LIMIT;
  const totalCount = documents.length + stagedFiles.length;
  const atLimit = totalCount >= limit;

  const handleFile = (file: File) => {
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      addToast("Only JPG, PNG or PDF files are accepted.", "error");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      addToast("File must be under 10 MB.", "error");
      return;
    }
    onStagedFilesChange([...stagedFiles, file]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (atLimit) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const unstageFile = (index: number) => {
    onStagedFilesChange(stagedFiles.filter((_, i) => i !== index));
  };

  const handleDelete = async (documentId: string) => {
    await VaultService.deleteDocument(recordId, documentId);
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    setConfirmDeleteId(null);
    addToast("Document removed.", "success");
  };

  const handleView = async (documentId: string) => {
    const result = await VaultService.getDocumentUrl(recordId, documentId);
    if (result) window.open(result.url, "_blank");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="font-medium text-[13px] text-text-primary">Documents</p>
      <p className="text-[13px] text-text-secondary mt-1">
        Attach a photo or scan of the source document for this asset.
      </p>

      {documentUrl && (
        <div className="mt-3 flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 min-w-0 text-[12.5px] text-navy hover:underline"
          >
            <Link2 size={14} className="flex-shrink-0" />
            <span className="truncate">{documentUrl}</span>
          </a>
          <button
            type="button"
            onClick={() => onDocumentUrlChange?.("")}
            className="text-[11.5px] text-text-tertiary hover:text-red cursor-pointer bg-transparent border-none flex-shrink-0"
          >
            Remove
          </button>
        </div>
      )}

      {!loading && (documents.length > 0 || stagedFiles.length > 0) && (
        <ul className="mt-4 space-y-2">
          {documents.map((doc, i) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-text-primary truncate">Document {i + 1}</p>
                  <p className="text-[11.5px] text-text-tertiary">{formatBytes(doc.sizeBytes)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleView(doc.id)} title="View">
                  <Eye size={14} />
                </Button>
                {confirmDeleteId === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="text-[12px] text-red cursor-pointer bg-transparent border-none font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[12px] text-text-tertiary cursor-pointer bg-transparent border-none"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteId(doc.id)}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </li>
          ))}

          {stagedFiles.map((file, i) => (
            <li
              key={`staged-${file.name}-${i}`}
              className="flex items-center justify-between gap-3 border border-dashed border-amber-300 bg-amber-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={16} className="text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-text-primary truncate">
                    Document {documents.length + i + 1}
                  </p>
                  <p className="text-[11.5px] text-amber-700">
                    {formatBytes(file.size)} · will upload when you save
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => unstageFile(i)}
                className="text-text-tertiary hover:text-red cursor-pointer bg-transparent border-none flex-shrink-0"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        isFree ? (
          <div className="mt-4">
            <UpgradePrompt
              feature="More documents per record"
              description={`Free plan includes ${FREE_DOCUMENT_LIMIT} document per record. Upgrade to Pro to attach up to ${PRO_DOCUMENT_LIMIT}.`}
            />
          </div>
        ) : (
          <p className="text-[12.5px] text-text-tertiary mt-4">
            {totalCount} of {PRO_DOCUMENT_LIMIT} documents attached. Pro plan limit reached.
          </p>
        )
      ) : (
        <>
          <div
            className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-[#3B82F6] bg-[#3B82F6]/5"
                : "border-blue-300 bg-[#F8FAFF] hover:border-[#3B82F6]"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload size={24} className="text-[#3B82F6] mx-auto" />
            <p className="text-[13px] text-text-secondary mt-2">
              Click to upload or drag and drop
            </p>
            <p className="text-[11.5px] text-text-tertiary mt-1">JPG, PNG or PDF · Max 10MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIMES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />

          {!loading && (
            <p className="text-[11.5px] text-text-tertiary mt-2">
              {totalCount} of {limit} document{limit === 1 ? "" : "s"}
              {stagedFiles.length > 0 ? " · new documents upload when you save" : " attached"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
