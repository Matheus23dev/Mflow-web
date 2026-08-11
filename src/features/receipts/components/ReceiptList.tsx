import { useState } from "react";
import { ExternalLink, FileImage, FileText, Trash2 } from "lucide-react";
import type { Receipt } from "@/shared/types";
import { Button } from "@/shared/ui";
import { receiptsService } from "../services/receipts.service";

const labels = {
  LOAN_DISBURSEMENT: "Dinheiro emprestado",
  PAYMENT: "Pagamento recebido",
  RENEWAL: "Dinheiro da renovação",
} as const;

function fileSize(value: number) {
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1000))} KB`;
}

export function ReceiptList({ receipts, onChanged }: { receipts: Receipt[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function open(receipt: Receipt) {
    setBusy(receipt.id);
    setError("");
    try {
      const blob = await receiptsService.file(receipt.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível abrir o comprovante.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(receipt: Receipt) {
    if (!window.confirm(`Apagar o comprovante “${receipt.originalName}”?`)) return;
    setBusy(receipt.id);
    setError("");
    try {
      await receiptsService.remove(receipt.id);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível apagar o comprovante.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="receipt-list mt-4 min-w-0 border-t border-slate-100 pt-4">
      <div className="mb-2 flex items-center justify-between gap-3"><strong className="text-xs text-slate-700">Comprovantes do contrato</strong><span className="text-[10px] text-slate-400">{receipts.length} arquivo{receipts.length === 1 ? "" : "s"}</span></div>
      {receipts.length ? (
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[641px]:grid-cols-2">
          {receipts.map((receipt) => {
            const Icon = receipt.mimeType === "application/pdf" ? FileText : FileImage;
            return (
              <div key={receipt.id} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><Icon size={17} /></span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-[11px] text-slate-700">{labels[receipt.kind]}</strong><span className="mt-1 block truncate text-[9.5px] text-slate-400">{receipt.originalName} · {fileSize(receipt.sizeBytes)}</span></div>
                <Button className="!min-h-9 !px-2.5" variant="ghost" loading={busy === receipt.id} onClick={() => open(receipt)} aria-label="Abrir comprovante"><ExternalLink size={15} /></Button>
                <Button className="!min-h-9 !px-2.5" variant="ghost" disabled={busy === receipt.id} onClick={() => remove(receipt)} aria-label="Apagar comprovante"><Trash2 size={15} /></Button>
              </div>
            );
          })}
        </div>
      ) : <p className="m-0 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-center text-[10.5px] text-slate-400">Nenhum comprovante salvo neste contrato.</p>}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
