"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SheetContext = React.createContext<{ close: () => void }>({
  close: () => {},
});

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <SheetContext.Provider value={{ close: () => onOpenChange(false) }}>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </SheetContext.Provider>,
    document.body
  );
}

function SheetContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { close } = React.useContext(SheetContext);
  return (
    <div
      className={cn(
        "relative z-10 bg-white h-full overflow-y-auto shadow-xl p-6 flex flex-col",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={close}
        className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      {children}
    </div>
  );
}

function SheetHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 pr-6", className)}>{children}</div>
  );
}

function SheetTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-text-primary", className)}>
      {children}
    </h2>
  );
}

function SheetDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-text-secondary", className)}>{children}</p>
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
