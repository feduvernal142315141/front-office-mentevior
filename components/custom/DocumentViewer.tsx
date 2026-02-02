"use client";

import { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
  fileName?: string;
}

export function DocumentViewer({ open, onClose, documentUrl, fileName = "document.pdf" }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);

  const displayFileName = fileName || 'document.pdf';
  const fileType = 'PDF Document';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-[9998]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
            "z-[9999]",
            "max-w-[75vw] w-full h-[85vh]",
            "bg-surface-primary border border-border-hairline rounded-xl shadow-2xl",
            "overflow-hidden flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#037ECC]" />
                </div>
                <div>
                  <DialogTitle className="text-gray-900 text-base font-semibold">
                    {displayFileName}
                  </DialogTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{fileType}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className={cn(
                    "w-9 h-9 rounded-lg",
                    "bg-white border border-gray-200",
                    "hover:bg-red-50 hover:border-red-300",
                    "transition-all duration-200",
                    "flex items-center justify-center",
                    "cursor-pointer"
                  )}
                >
                  <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-50 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
                  <p className="text-sm text-gray-600">Loading PDF document...</p>
                </div>
              </div>
            )}

            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              title={displayFileName}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
