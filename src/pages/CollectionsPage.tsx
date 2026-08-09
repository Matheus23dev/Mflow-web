import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarCheck2, CircleDollarSign, Clock3, MessageCircle, Phone, Search } from "lucide-react";
import { api, queryString } from "../lib/api";
import { date, money, todayInput } from "../lib/format";
import type { CollectionItem, Loan, Payment } from "../types";
import { Avatar, Button, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, Select, StatusBadge, Textarea } from "../components/UI";

type PaymentType = Payment["type"];

function accruedLateFee(dueDate: string, lateFeePerDay: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.max(0, Math.floor((todayUtc - dueUtc) / 86_400_000));
  return days * Number(lateFeePerDay || 0);
}

export function PaymentModal({ loanId, preset, onClose, onSaved }: { loanId: string | null; preset?: CollectionItem | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("INSTALLMENT");
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loanId) return;
    api<Loan>(`/loans/${loanId}`).then((result) => {
      setLoan(result);
      setError("");
      const initialType: PaymentType = preset ? (preset.type === "WEEKLY" ? "INSTALLMENT" : "INTEREST") : result.type === "WEEKLY" ? "INSTALLMENT" : "INTEREST";
      setPaymentType(initialType);
      setChargeId(preset?.id || "");
      setAmount(preset ? String(preset.updatedAmount) : "");
    }).catch((caught) => setError(caught.message)).finally(() => setLoading(false));
  }, [loanId, preset]);

  const availableCharges = useMemo(() => {
    if (!loan) return [];
    return (paymentType === "INSTALLMENT" ? loan.installments : loan.monthlyCharges).filter((charge) => charge.status !== "PAID");
  }, [loan, paymentType]);

  function selectType(next: PaymentType) {
    setPaymentType(next);
    setChargeId("");
    if (next === "PAYOFF") setAmount(String(loan?.type === "WEEKLY" ? loan.summary.openBalance + loan.summary.lateFees : loan?.principalBalance || ""));
    else if (next === "PRINCIPAL") setAmount("");
    else setAmount("");
  }

  function selectCharge(id: string) {
    setChargeId(id);
    const charge = availableCharges.find((item) => item.id === id);
    if (charge) {
      const outstanding = Number(charge.amount || charge.interestAmount) - Number(charge.paidAmount);
      setAmount(String(outstanding + accruedLateFee(charge.dueDate, loan?.lateFeePerDay || "0")));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loan) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api<Payment>("/payments", {
        method: "POST",
        body: JSON.stringify({
          loanId: loan.id,
          type: paymentType,
          amount: Number(amount),
          paymentDate: data.get("paymentDate"),
          paymentMethod: data.get("paymentMethod"),
          notes: data.get("notes"),
          ...(paymentType === "INSTALLMENT" ? { installmentId: chargeId } : {}),
          ...(paymentType === "INTEREST" ? { monthlyChargeId: chargeId } : {}),
        }),
      });
      onSaved("Pagamento registrado e caixa atualizado.");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSaving(false);
    }
  }

  const paymentOptions = loan?.type === "WEEKLY"
    ? [{ value: "INSTALLMENT", label: "Parcela" }, { value: "PAYOFF", label: "Quitação" }]
    : [{ value: "INTEREST", label: "Juros mensal" }, { value: "PRINCIPAL", label: "Abater principal" }, { value: "PAYOFF", label: "Quitar principal" }];

  return (
    <Modal open={Boolean(loanId)} onClose={onClose} title="Registrar pagamento" description={loan ? `${loan.customer.name} · ${loan.type === "WEEKLY" ? "Contrato parcelado" : "Juros mensal"}` : "Atualizando dados do contrato"}>
      {loading ? <LoadingState label="Carregando contrato" /> : null}
      {loan && !loading ? (
        <form className="form-grid" onSubmit={submit}>
          <div className="field-span payment-type-tabs">
            {paymentOptions.map((option) => <button key={option.value} type="button" className={paymentType === option.value ? "selected" : ""} onClick={() => selectType(option.value as PaymentType)}>{option.label}</button>)}
          </div>
          {["INSTALLMENT", "INTEREST"].includes(paymentType) ? (
            <div className="field-span"><Field label={paymentType === "INSTALLMENT" ? "Parcela" : "Cobrança mensal"}><Select value={chargeId} onChange={(event) => selectCharge(event.target.value)} required><option value="" disabled>Selecione a cobrança</option>{availableCharges.map((charge) => <option key={charge.id} value={charge.id}>{charge.number ? `Parcela ${charge.number}/${loan.installmentCount}` : `Juros ${charge.referenceMonth}`} · vence {date(charge.dueDate)} · {money(Number(charge.amount || charge.interestAmount) - Number(charge.paidAmount))}</option>)}</Select></Field></div>
          ) : null}
          <Field label="Valor recebido"><Input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
          <Field label="Data do pagamento"><Input name="paymentDate" type="date" defaultValue={todayInput()} required /></Field>
          <div className="field-span"><Field label="Forma de pagamento"><Select name="paymentMethod" defaultValue="PIX"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="TRANSFER">Transferência</option><option value="OTHER">Outro</option></Select></Field></div>
          <div className="field-span"><Field label="Observações" hint="Opcional"><Textarea name="notes" rows={2} placeholder="Ex.: pagamento combinado por mensagem" /></Field></div>
          {error ? <div className="form-error field-span">{error}</div> : null}
          <div className="form-actions field-span"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" loading={saving}>Confirmar pagamento</Button></div>
        </form>
      ) : null}
      {error && !loan ? <ErrorState message={error} /> : null}
    </Modal>
  );
}

const filters = [
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "week", label: "7 dias" },
  { value: "overdue", label: "Em atraso" },
  { value: "30days", label: "30 dias" },
] as const;

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function reminderText(item: CollectionItem) {
  const timing = item.status === "OVERDUE" ? `está em atraso há ${item.daysOverdue} dia${item.daysOverdue === 1 ? "" : "s"}` : `vence em ${date(item.dueDate)}`;
  return `Olá, ${item.customer.name}. Lembrete: ${item.label}, no valor de ${money(item.updatedAmount)}, ${timing}.`;
}

export function CollectionsPage({ refreshKey, onPayment }: { refreshKey: number; onPayment: (item: CollectionItem) => void }) {
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("week");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<CollectionItem[]>(`/collections${queryString({ filter })}`).then((result) => { setItems(result); setError(""); }).catch((caught) => setError(caught.message));
  }, [filter]);

  useEffect(load, [load, refreshKey]);
  const filtered = useMemo(() => items?.filter((item) => item.customer.name.toLowerCase().includes(search.toLowerCase())) || [], [items, search]);
  const total = filtered.reduce((sum, item) => sum + item.updatedAmount, 0);
  const overdue = filtered.filter((item) => item.status === "OVERDUE").reduce((sum, item) => sum + item.updatedAmount, 0);

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Agenda" title="Cobranças" description="Priorize vencimentos, atrasos e contatos do dia." />
      <div className="collection-summary">
        <div><span className="summary-icon purple"><CalendarCheck2 size={20} /></span><p><span>No período</span><strong>{money(total)}</strong><small>{filtered.length} cobranças</small></p></div>
        <div><span className="summary-icon red"><Clock3 size={20} /></span><p><span>Em atraso</span><strong>{money(overdue)}</strong><small>{filtered.filter((item) => item.status === "OVERDUE").length} pendências</small></p></div>
      </div>
      <section className="panel table-panel">
        <div className="collection-toolbar"><div className="segmented">{filters.map((item) => <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><div className="search-box small"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente" /></div></div>
        {!items && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {items && filtered.length === 0 ? <EmptyState title="Nenhuma cobrança neste período" description="Escolha outro filtro para consultar a agenda financeira." /> : null}
        {filtered.length ? <div className="collection-table-head"><span>Vencimento</span><span>Cliente</span><span>Cobrança</span><span>Valor a receber</span><span>Ações</span></div> : null}
        <div className="collection-list">
          {filtered.map((item) => (
            <article className={`collection-card ${item.status === "OVERDUE" ? "is-overdue" : ""}`} key={item.id}>
              <div className="collection-date"><span>{new Date(item.dueDate).getUTCDate().toString().padStart(2, "0")}</span><small>{new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(new Date(item.dueDate)).replace(".", "")}</small></div>
              <div className="collection-customer"><Avatar name={item.customer.name} /><div><strong>{item.customer.name}</strong><span><Phone size={13} /> {item.customer.phone}</span></div></div>
              <div className="collection-charge"><div><strong>{item.label}</strong><StatusBadge status={item.status} /></div>{item.lateFee > 0 ? <span className="danger-text">{item.daysOverdue} dia{item.daysOverdue === 1 ? "" : "s"} · juros {money(item.lateFee)}</span> : item.paidAmount > 0 ? <span>Já recebido: {money(item.paidAmount)}</span> : null}</div>
              <div className="collection-total"><span>A receber</span><strong>{money(item.updatedAmount)}</strong>{item.lateFee > 0 ? <small>Parcela {money(item.outstanding)} + juros</small> : item.paidAmount > 0 ? <small>Original {money(item.originalAmount)}</small> : null}</div>
              <div className="collection-actions"><a className="icon-button" href={`https://wa.me/${whatsappPhone(item.customer.phone)}?text=${encodeURIComponent(reminderText(item))}`} target="_blank" rel="noreferrer" aria-label={`Enviar lembrete para ${item.customer.name}`}><MessageCircle size={18} /></a><Button onClick={() => onPayment(item)}><CircleDollarSign size={17} /> Receber</Button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
