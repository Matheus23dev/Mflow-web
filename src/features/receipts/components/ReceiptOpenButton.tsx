import { useState } from "react";
import { FileSearch } from "lucide-react";
import type { Receipt } from "@/shared/types";
import { Button } from "@/shared/ui";
import { receiptsService } from "../services/receipts.service";

export function ReceiptOpenButton({
  receipt,
  label,
  className = "",
}: {
  receipt: Receipt;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function open() {
    const preview = window.open("", "_blank");
    setLoading(true);
    try {
      const { url } = await receiptsService.file(receipt.id);
      if (preview) {
        preview.opener = null;
        preview.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (caught) {
      preview?.close();
      window.alert(
        caught instanceof Error
          ? caught.message
          : "Não foi possível abrir o comprovante.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={`!min-h-8 !px-2 text-violet-700 ${className}`}
      loading={loading}
      onClick={open}
      aria-label={label || "Visualizar comprovante Pix"}
      title={label || "Visualizar comprovante Pix"}
    >
      <FileSearch size={15} />
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
