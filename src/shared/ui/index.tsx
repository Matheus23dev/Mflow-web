import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import type { ChargeStatus, LoanStatus } from "@/shared/types";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

let modalLockCount = 0;
let modalPageState: {
  bodyOverflow: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
  bodyHadClass: boolean;
  htmlHadClass: boolean;
} | null = null;

function lockPageBehindModal() {
  if (modalLockCount === 0) {
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth,
    );
    const currentPadding =
      Number.parseFloat(window.getComputedStyle(document.body).paddingRight) ||
      0;
    modalPageState = {
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
      bodyHadClass: document.body.classList.contains("modal-open"),
      htmlHadClass: document.documentElement.classList.contains("modal-open"),
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
  }
  modalLockCount += 1;

  return () => {
    modalLockCount = Math.max(0, modalLockCount - 1);
    if (modalLockCount !== 0 || !modalPageState) return;
    document.body.style.overflow = modalPageState.bodyOverflow;
    document.body.style.paddingRight = modalPageState.bodyPaddingRight;
    document.documentElement.style.overflow = modalPageState.htmlOverflow;
    if (!modalPageState.bodyHadClass)
      document.body.classList.remove("modal-open");
    if (!modalPageState.htmlHadClass)
      document.documentElement.classList.remove("modal-open");
    modalPageState = null;
  };
}

export function Button({
  className = "",
  variant = "primary",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_8px_20px_rgba(109,67,220,0.24)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(109,67,220,0.3)]",
    secondary:
      "border border-violet-100 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700",
    ghost:
      "bg-transparent text-slate-500 hover:bg-violet-50 hover:text-violet-700",
    danger: "bg-rose-500 text-white shadow-sm hover:bg-rose-600",
  } as const;

  return (
    <button
      data-ui="button"
      className={`inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-semibold leading-none transition duration-200 [&>svg]:shrink-0 disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle size={17} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-16 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-violet-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full print:hidden sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-xs leading-5 text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      data-ui="input"
      className={`w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${className}`}
      {...props}
    />
  );
}

function compactInputDate(value: string | number | readonly string[] | undefined) {
  if (typeof value !== "string" || !value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year.slice(-2)}`;
}

export function CompactDateInput({
  className = "",
  placeholder = "Data",
  value,
  onClick,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span
      className={`relative flex h-9 min-w-0 max-w-full items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`block min-w-0 flex-1 truncate px-1.5 text-center text-[10px] font-medium [font-variant-numeric:tabular-nums] min-[641px]:px-2 min-[641px]:text-xs ${value ? "text-slate-700" : "text-slate-400"}`}
      >
        {compactInputDate(value) || placeholder}
      </span>
      <input
        {...props}
        data-ui="compact-date-input"
        className="absolute inset-0 block h-full w-full min-w-0 max-w-full cursor-pointer border-0 opacity-0 [font-size:16px]"
        type="date"
        value={value}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            try {
              event.currentTarget.showPicker?.();
            } catch {
              // O Safari do iPhone abre o seletor pelo toque nativo.
            }
          }
        }}
      />
    </span>
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-ui="input"
      className={`w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-ui="textarea"
      className={`min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${className}`}
      {...props}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const unlockPage = lockPageBehindModal();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      unlockPage();
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      data-modal-layer
      className="fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-5 print:static print:block print:min-h-0 print:overflow-visible print:bg-white print:p-0 print:backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        data-modal
        className={`flex max-h-[min(90dvh,800px)] min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_25px_70px_rgba(26,20,39,0.25)] print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none ${size === "sm" ? "max-w-md" : size === "lg" ? "max-w-4xl" : "max-w-2xl"}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5 print:hidden">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="break-words text-xl font-semibold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>
        <div
          data-modal-body
          className="overflow-x-hidden overflow-y-auto p-5 sm:p-6 print:overflow-visible print:p-0"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LoadingState({
  label = "Carregando dados",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-44 items-center justify-center gap-2 p-7 text-sm text-slate-500">
      <LoaderCircle className="animate-spin text-violet-600" size={24} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center p-7 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
        <Inbox size={24} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-30 flex-wrap items-center justify-center gap-3 p-6 text-center text-sm text-rose-700">
      <AlertCircle size={21} />
      <span>{message}</span>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

const statusLabels: Record<LoanStatus | ChargeStatus, string> = {
  ACTIVE: "Em dia",
  OVERDUE: "Em atraso",
  PAID: "Pago",
  RENEWED: "Renovado",
  CANCELLED: "Cancelado",
  PENDING: "Pendente",
  PARTIAL: "Parcial",
};

export function StatusBadge({ status }: { status: LoanStatus | ChargeStatus }) {
  const tones = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PAID: "bg-emerald-50 text-emerald-700",
    OVERDUE: "bg-rose-50 text-rose-700",
    PENDING: "bg-amber-50 text-amber-700",
    PARTIAL: "bg-blue-50 text-blue-700",
    RENEWED: "bg-violet-50 text-violet-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  } as const;

  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 rounded-full px-2 py-1 text-[0.65rem] font-bold leading-none whitespace-nowrap ${tones[status]}`}
    >
      <i className="size-1 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "size-8 rounded-lg text-[0.65rem]",
    md: "size-9 rounded-xl text-xs",
    lg: "size-12 rounded-2xl text-sm",
  } as const;
  return (
    <span
      data-ui="avatar"
      className={`inline-grid shrink-0 place-items-center border border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100 font-extrabold leading-none text-violet-700 ${sizes[size]}`}
    >
      {letters}
    </span>
  );
}

export function Toast({
  message,
  tone = "success",
  onClose,
}: {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      data-ui="toast"
      className={`fixed right-4 bottom-4 z-[150] flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-xl border-l-4 px-4 py-3 text-sm text-white shadow-2xl print:hidden sm:right-6 sm:bottom-6 ${tone === "success" ? "border-emerald-400 bg-slate-900" : "border-rose-400 bg-slate-900"}`}
      role="status"
    >
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <button
        className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
