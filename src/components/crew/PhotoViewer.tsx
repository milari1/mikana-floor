'use client';

import { X } from 'lucide-react';

export function PhotoViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Spec photo"
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}
