"use client";

import { useToastStore, type Toast, type ToastVariant } from "@/stores/toastStore";
import { X, CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const styles: Record<ToastVariant, string> = {
  success: "bg-green-light border border-[#A7D7B8] text-green",
  error:   "bg-red-light border border-[#F5B0B0] text-red",
  info:    "bg-accent-light border border-[#C7D6FB] text-accent",
};

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  info:    <Info size={15} />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-md text-[13px] font-medium min-w-[280px] max-w-[380px]",
        styles[toast.variant]
      )}
    >
      {icons[toast.variant]}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => remove(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity ml-1"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
