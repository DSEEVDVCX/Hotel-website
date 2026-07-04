"use client";

import { useState } from "react";
import { useLanguage } from "@/app/providers";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelDialog({ open, onClose, onConfirm }: CancelDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t.booking.cancelConfirm}>
      <div className="flex flex-col gap-4">
        <p className="text-[var(--color-text-muted)]">{t.booking.cancelConfirm}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{"<"}</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? "..." : t.booking.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
