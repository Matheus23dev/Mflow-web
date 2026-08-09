import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import type { ChargeStatus, LoanStatus } from "../types";

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
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    modalPageState = {
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
      bodyHadClass: document.body.classList.contains("modal-open"),
      htmlHadClass: document.documentElement.classList.contains("modal-open"),
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
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
    if (!modalPageState.bodyHadClass) document.body.classList.remove("modal-open");
    if (!modalPageState.htmlHadClass) document.documentElement.classList.remove("modal-open");
    modalPageState = null;
  };
}

export function Button({ className = "", variant = "primary", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle size={17} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${props.className || ""}`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`input ${props.className || ""}`} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input textarea ${props.className || ""}`} {...props} />;
}

export function Modal({ open, onClose, title, description, children, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: "sm" | "md" | "lg" }) {
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
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function LoadingState({ label = "Carregando dados" }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="animate-spin" size={24} /><span>{label}</span></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Inbox size={24} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <AlertCircle size={21} />
      <span>{message}</span>
      {onRetry ? <Button variant="ghost" onClick={onRetry}>Tentar novamente</Button> : null}
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
  return <span className={`status status-${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const letters = name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <span className={`avatar avatar-${size}`}>{letters}</span>;
}

export function Toast({ message, tone = "success", onClose }: { message: string; tone?: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`toast toast-${tone}`} role="status">
      <span>{message}</span>
      <button onClick={onClose} aria-label="Fechar"><X size={16} /></button>
    </div>
  );
}
