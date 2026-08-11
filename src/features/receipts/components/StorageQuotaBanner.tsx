import { useEffect, useState } from "react";
import { AlertTriangle, HardDrive } from "lucide-react";
import type { ReceiptStorageStatus } from "@/shared/types";
import { receiptsService } from "../services/receipts.service";

export function StorageQuotaBanner({ refreshKey }: { refreshKey: number }) {
  const [status, setStatus] = useState<ReceiptStorageStatus | null>(null);

  useEffect(() => {
    receiptsService.status().then(setStatus).catch(() => undefined);
  }, [refreshKey]);

  if (!status?.configured || status.level === "NORMAL") return null;
  const blocked = status.level === "BLOCKED";
  return (
    <div className={`fixed left-3 right-3 top-[72px] z-[25] mx-auto flex max-w-xl items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-5 shadow-xl min-[641px]:left-auto min-[641px]:right-6 min-[641px]:top-[82px] ${blocked ? "border-rose-300 bg-rose-50 text-rose-800" : "border-amber-300 bg-amber-50 text-amber-900"}`} role="alert">
      {blocked ? <HardDrive className="mt-0.5 shrink-0" size={18} /> : <AlertTriangle className="mt-0.5 shrink-0" size={18} />}
      <div><strong className="block">{blocked ? "Novos comprovantes bloqueados" : "Espaço de comprovantes perto do limite"}</strong><span>{(status.usedBytes / 1_000_000_000).toFixed(2)} GB usados de {(status.hardLimitBytes / 1_000_000_000).toFixed(0)} GB do limite de segurança.</span></div>
    </div>
  );
}
