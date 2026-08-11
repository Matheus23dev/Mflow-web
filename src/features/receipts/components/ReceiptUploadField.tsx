import { Paperclip, X } from "lucide-react";
import { Field, Input } from "@/shared/ui";

export function ReceiptUploadField({ label, file, onChange, disabled = false }: { label: string; file: File | null; onChange: (file: File | null) => void; disabled?: boolean }) {
  return (
    <Field label={label} hint="Opcional · imagem até 10 MB ou PDF até 3 MB. Imagens são compactadas automaticamente.">
      <div className="min-w-0 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-3">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-violet-700"
        />
        {file ? (
          <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-slate-600">
            <Paperclip size={14} className="shrink-0 text-violet-600" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button type="button" className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-rose-600" onClick={() => onChange(null)} aria-label="Remover arquivo selecionado"><X size={14} /></button>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
