import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck2,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";
import { date, formatPhone, money, todayInput } from "@/shared/lib/format";
import type { CollectionItem, Loan, Payment } from "@/shared/types";
import {
  Avatar,
  Button,
  CompactDateInput,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from "@/shared/ui";
import { useCollections } from "../hooks/useCollections";
import {
  collectionsService,
  type CollectionFilter,
} from "../services/collections.service";
import { CollectionSummaryCard } from "../components/CollectionSummaryCard";
import { ReceiptUploadField } from "@/features/receipts/components/ReceiptUploadField";
import { receiptsService } from "@/features/receipts/services/receipts.service";

type PaymentType = Payment["type"];

const formGridClass =
  "form-grid grid grid-cols-1 gap-[15px] min-[641px]:grid-cols-2 [&>*]:min-w-0";
const fieldSpanClass = "field-span min-[641px]:col-span-2";
const formActionsClass =
  "form-actions -mx-[17px] -mb-[18px] mt-[3px] flex flex-col-reverse justify-end gap-2 border-t border-[#ebe8ee] bg-[#fbfafd] px-[17px] py-[13px] min-[421px]:flex-row min-[641px]:-mx-[22px] min-[641px]:-mb-[22px] min-[641px]:mt-1 min-[641px]:px-[22px] min-[641px]:py-[14px] max-[420px]:[&>[data-ui=button]]:w-full";

function accruedLateFee(
  dueDate: string,
  lateFeePerDay: string,
  paymentDate = todayInput(),
) {
  const due = new Date(dueDate);
  const reference = new Date(`${paymentDate}T00:00:00.000Z`);
  const dueUtc = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const referenceUtc = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const days = Math.max(
    0,
    Math.floor((referenceUtc - dueUtc) / 86_400_000),
  );
  return days * Number(lateFeePerDay || 0);
}

export function PaymentModal({
  loanId,
  preset,
  onClose,
  onSaved,
  onWarning,
}: {
  loanId: string | null;
  preset?: CollectionItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onWarning: (message: string) => void;
}) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("INSTALLMENT");
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [waiveLateFee, setWaiveLateFee] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<Payment["paymentMethod"]>("PIX");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(Boolean(loanId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loanId) return;
    collectionsService
      .loan(loanId)
      .then((result) => {
        setLoan(result);
        setError("");
        const initialType: PaymentType = preset
          ? preset.type === "WEEKLY"
            ? "INSTALLMENT"
            : "INTEREST"
          : result.type === "WEEKLY"
            ? "INSTALLMENT"
            : "INTEREST";
        setPaymentType(initialType);
        setChargeId(preset?.id || "");
        setAmount(preset ? String(preset.updatedAmount) : "");
      })
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, [loanId, preset]);

  const availableCharges = useMemo(() => {
    if (!loan) return [];
    return (
      paymentType === "INSTALLMENT" ? loan.installments : loan.monthlyCharges
    ).filter((charge) => charge.status !== "PAID");
  }, [loan, paymentType]);

  const selectedCharge = useMemo(
    () => availableCharges.find((charge) => charge.id === chargeId),
    [availableCharges, chargeId],
  );
  const selectedOutstanding = selectedCharge
    ? Number(selectedCharge.amount || selectedCharge.interestAmount) -
      Number(selectedCharge.paidAmount)
    : 0;
  const selectedLateFee = selectedCharge
    ? accruedLateFee(
        selectedCharge.dueDate,
        loan?.lateFeePerDay || "0",
        paymentDate,
      )
    : 0;

  function selectType(next: PaymentType) {
    setPaymentType(next);
    setChargeId("");
    setWaiveLateFee(false);
    if (next === "PAYOFF")
      setAmount(
        String(
          loan?.type === "WEEKLY"
            ? loan.summary.openBalance + loan.summary.lateFees
            : loan?.principalBalance || "",
        ),
      );
    else if (next === "PRINCIPAL") setAmount("");
    else setAmount("");
  }

  function selectCharge(id: string) {
    setChargeId(id);
    setWaiveLateFee(false);
    const charge = availableCharges.find((item) => item.id === id);
    if (!charge) return;
    const outstanding =
      Number(charge.amount || charge.interestAmount) -
      Number(charge.paidAmount);
    const fee = accruedLateFee(
      charge.dueDate,
      loan?.lateFeePerDay || "0",
      paymentDate,
    );
    setAmount(String(Number((outstanding + fee).toFixed(2))));
  }

  function changePaymentDate(nextDate: string) {
    setPaymentDate(nextDate);
    if (!selectedCharge) return;
    const fee = accruedLateFee(
      selectedCharge.dueDate,
      loan?.lateFeePerDay || "0",
      nextDate,
    );
    const value = selectedOutstanding + (waiveLateFee ? 0 : fee);
    setAmount(String(Number(value.toFixed(2))));
  }

  function toggleLateFee() {
    const nextWaiveLateFee = !waiveLateFee;
    setWaiveLateFee(nextWaiveLateFee);
    const value =
      selectedOutstanding + (nextWaiveLateFee ? 0 : selectedLateFee);
    setAmount(String(Number(value.toFixed(2))));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loan) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const payment = await collectionsService.receive({
        loanId: loan.id,
        type: paymentType,
        amount: Number(amount),
        paymentDate: data.get("paymentDate"),
        paymentMethod,
        notes: data.get("notes"),
        ...(["INSTALLMENT", "INTEREST"].includes(paymentType)
          ? { waiveLateFee }
          : {}),
        ...(paymentType === "INSTALLMENT" ? { installmentId: chargeId } : {}),
        ...(paymentType === "INTEREST" ? { monthlyChargeId: chargeId } : {}),
      });
      let warning: string | undefined;
      let successMessage = "Pagamento registrado e caixa atualizado.";
      if (receiptFile) {
        if (
          payment.loanStatus &&
          !["ACTIVE", "OVERDUE"].includes(payment.loanStatus)
        ) {
          successMessage =
            "Pagamento registrado. Como o contrato foi encerrado, o comprovante desta parcela não foi mantido; o comprovante do valor emprestado continua no histórico.";
        } else {
          try {
            await receiptsService.upload(
              loan.id,
              receiptFile,
              "PAYMENT",
              payment.id,
            );
          } catch (caught) {
            warning = `Pagamento registrado, mas o comprovante não foi salvo: ${caught instanceof Error ? caught.message : "erro no armazenamento"}`;
          }
        }
      }
      if (warning) onWarning(warning);
      else onSaved(successMessage);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível registrar o pagamento.",
      );
    } finally {
      setSaving(false);
    }
  }

  const paymentOptions =
    loan?.type === "WEEKLY"
      ? [
          { value: "INSTALLMENT", label: "Parcela" },
          { value: "PAYOFF", label: "Quitação" },
        ]
      : [
          { value: "INTEREST", label: "Juros mensal" },
          { value: "PRINCIPAL", label: "Abater principal" },
          { value: "PAYOFF", label: "Quitar principal" },
        ];

  return (
    <Modal
      open={Boolean(loanId)}
      onClose={onClose}
      title="Registrar pagamento"
      description={
        loan
          ? `${loan.customer.name} · ${loan.type === "WEEKLY" ? "Contrato parcelado" : "Juros mensal"}`
          : "Atualizando dados do contrato"
      }
    >
      {loading ? <LoadingState label="Carregando contrato" /> : null}
      {loan && !loading ? (
        <form className={formGridClass} onSubmit={submit}>
          <div
            className={`${fieldSpanClass} payment-type-tabs grid min-w-0 max-w-full grid-cols-1 gap-[5px] rounded-[9px] bg-[#f1eff4] p-1 min-[421px]:flex`}
          >
            {paymentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`min-w-0 flex-1 [overflow-wrap:anywhere] rounded-[7px] border-0 px-2 py-2 text-[11px] font-bold ${paymentType === option.value ? "selected bg-white text-violet-700 shadow-[0_2px_7px_rgba(44,35,68,.08)]" : "bg-transparent text-[#817c89]"}`}
                onClick={() => selectType(option.value as PaymentType)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {["INSTALLMENT", "INTEREST"].includes(paymentType) ? (
            <div className={fieldSpanClass}>
              <Field
                label={
                  paymentType === "INSTALLMENT" ? "Parcela" : "Cobrança mensal"
                }
              >
                <Select
                  value={chargeId}
                  onChange={(event) => selectCharge(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione a cobrança
                  </option>
                  {availableCharges.map((charge) => (
                    <option key={charge.id} value={charge.id}>
                      {charge.number
                        ? `Parcela ${charge.number}/${loan.installmentCount}`
                        : `Juros ${charge.referenceMonth}`}{" "}
                      · vence {date(charge.dueDate)} ·{" "}
                      {money(
                        Number(charge.amount || charge.interestAmount) -
                          Number(charge.paidAmount),
                      )}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}
          <Field label="Valor recebido">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label="Data do pagamento">
            <Input
              name="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(event) => changePaymentDate(event.target.value)}
              required
            />
          </Field>
          {selectedCharge && selectedLateFee > 0 ? (
            <div className={fieldSpanClass}>
              <div
                className={`flex min-w-0 flex-col gap-3 rounded-xl border p-3 min-[421px]:flex-row min-[421px]:items-center min-[421px]:justify-between ${waiveLateFee ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <strong
                    className={`text-xs ${waiveLateFee ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {waiveLateFee
                      ? "Juros removidos deste pagamento"
                      : `Juros de atraso: ${money(selectedLateFee)}`}
                  </strong>
                  <span className="text-[11px] leading-relaxed text-slate-500">
                    {waiveLateFee
                      ? `Será cobrado somente o valor original pendente de ${money(selectedOutstanding)}.`
                      : `Valor original pendente: ${money(selectedOutstanding)}.`}
                  </span>
                </div>
                <button
                  type="button"
                  aria-pressed={waiveLateFee}
                  className={`min-h-9 shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${waiveLateFee ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100" : "border-rose-300 bg-white text-rose-700 hover:bg-rose-100"}`}
                  onClick={toggleLateFee}
                >
                  {waiveLateFee ? "Incluir juros novamente" : "Remover juros"}
                </button>
              </div>
            </div>
          ) : null}
          <div className={fieldSpanClass}>
            <Field label="Forma de pagamento">
              <Select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as Payment["paymentMethod"],
                  )
                }
              >
                <option value="PIX">Pix</option>
                <option value="CASH">Dinheiro</option>
                <option value="TRANSFER">Transferência</option>
                <option value="OTHER">Outro</option>
              </Select>
            </Field>
          </div>
          <div className={fieldSpanClass}>
            <ReceiptUploadField
              label="Comprovante do pagamento"
              file={receiptFile}
              onChange={setReceiptFile}
            />
          </div>
          <div className={fieldSpanClass}>
            <Field label="Observações" hint="Opcional">
              <Textarea
                name="notes"
                rows={2}
                placeholder="Ex.: pagamento combinado por mensagem"
              />
            </Field>
          </div>
          {error ? (
            <div
              className={`${fieldSpanClass} form-error rounded-lg border border-rose-200 bg-rose-50 px-[11px] py-[9px] text-[11px] leading-relaxed text-rose-700`}
            >
              {error}
            </div>
          ) : null}
          <div className={`${fieldSpanClass} ${formActionsClass}`}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Confirmar pagamento
            </Button>
          </div>
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

const typeFilters = [
  { value: "ALL", label: "Todas as modalidades" },
  { value: "WEEKLY", label: "Parcelado" },
  { value: "MONTHLY_INTEREST", label: "Juros mensal" },
] as const;

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function reminderText(item: CollectionItem) {
  const timing =
    item.status === "OVERDUE"
      ? `está em atraso há ${item.daysOverdue} dia${item.daysOverdue === 1 ? "" : "s"}`
      : `vence em ${date(item.dueDate)}`;
  return `Olá, ${item.customer.name}. Lembrete: ${item.label}, no valor de ${money(item.updatedAmount)}, ${timing}.`;
}

export function CollectionsPage({
  refreshKey,
  onPayment,
}: {
  refreshKey: number;
  onPayment: (item: CollectionItem) => void;
}) {
  const [filter, setFilter] = useState<CollectionFilter>("week");
  const [typeFilter, setTypeFilter] =
    useState<(typeof typeFilters)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customPeriod, setCustomPeriod] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [periodError, setPeriodError] = useState("");
  const { items, error, reload: load } = useCollections(
    filter,
    refreshKey,
    customPeriod?.from,
    customPeriod?.to,
  );
  const filtered = useMemo(
    () =>
      items?.filter(
        (item) =>
          (typeFilter === "ALL" || item.type === typeFilter) &&
          item.customer.name.toLowerCase().includes(search.toLowerCase()),
      ) || [],
    [items, search, typeFilter],
  );
  const total = filtered.reduce((sum, item) => sum + item.updatedAmount, 0);
  const overdue = filtered
    .filter((item) => item.status === "OVERDUE")
    .reduce((sum, item) => sum + item.updatedAmount, 0);
  const customerCount = new Set(filtered.map((item) => item.customer.id)).size;

  function selectQuickFilter(value: (typeof filters)[number]["value"]) {
    setFilter(value);
    setCustomPeriod(null);
    setPeriodError("");
  }

  function applyCustomPeriod() {
    if (!dateFrom || !dateTo) {
      setPeriodError("Informe a data inicial e a data final.");
      return;
    }
    if (dateFrom > dateTo) {
      setPeriodError("A data inicial deve ser anterior à data final.");
      return;
    }
    setCustomPeriod({ from: dateFrom, to: dateTo });
    setFilter("custom");
    setPeriodError("");
  }

  return (
    <div className="page-enter data-page collections-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow="Agenda"
        title="Cobranças"
        description="Priorize vencimentos, atrasos e contatos do dia."
      />
      <div className="collection-summary mb-[17px] grid grid-cols-1 gap-[9px] min-[641px]:grid-cols-2 min-[641px]:gap-[15px]">
        <CollectionSummaryCard
          tone="purple"
          icon={<CalendarCheck2 size={20} />}
          label="No período"
          value={money(total)}
          detail={`${filtered.length} cobranças de ${customerCount} ${customerCount === 1 ? "pessoa" : "pessoas"}`}
        />
        <CollectionSummaryCard
          tone="red"
          icon={<Clock3 size={20} />}
          label="Em atraso"
          value={money(overdue)}
          detail={`${filtered.filter((item) => item.status === "OVERDUE").length} pendências`}
        />
      </div>
      <section className="panel table-panel min-w-0 overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:flex-col">
        <div className="collection-toolbar flex flex-col items-stretch justify-between gap-4 border-b border-[#eceaf0] px-[18px] py-[14px] min-[641px]:flex-row min-[641px]:items-center">
          <div className="segmented grid grid-cols-3 gap-1 rounded-[9px] bg-[#f3f1f6] p-[3px] min-[641px]:grid-cols-5">
            {filters.map((item) => (
              <button
                key={item.value}
                className={`min-h-9 min-w-0 rounded-[7px] border-0 px-1.5 py-[7px] text-[11.5px] font-semibold ${filter === item.value ? "active bg-white text-violet-700 shadow-[0_2px_7px_rgba(42,32,70,.08)]" : "bg-transparent text-[#888391]"}`}
                onClick={() => selectQuickFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[641px]:flex min-[641px]:w-auto">
            <Select
              aria-label="Filtrar modalidade"
              className="h-[43px] min-[641px]:w-[170px]"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as (typeof typeFilters)[number]["value"],
                )
              }
            >
              {typeFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <div className="search-box small flex h-[43px] w-full min-w-0 items-center gap-[9px] rounded-[9px] border border-[#e6e3ea] bg-[#faf9fc] px-[11px] text-[#9b97a3] focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100 min-[641px]:w-[210px]">
              <Search className="shrink-0" size={17} />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#373340] outline-none placeholder:text-[#aaa6b1] min-[641px]:text-[13px]"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente"
              />
            </div>
          </div>
        </div>
        <div className={`collection-period grid min-w-0 grid-cols-1 gap-2 border-b px-[18px] py-2.5 min-[641px]:grid-cols-[auto_minmax(260px,360px)_auto_minmax(0,1fr)] min-[641px]:items-end ${customPeriod ? "border-violet-200 bg-violet-50/40" : "border-[#eceaf0] bg-white"}`}>
          <div className="flex min-h-9 items-center gap-2 text-xs font-semibold text-slate-600">
            <CalendarRange className="text-violet-600" size={17} />
            Período personalizado
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[9px] font-semibold text-slate-500">Data inicial</span>
              <CompactDateInput
                aria-label="Data inicial das cobranças"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[9px] font-semibold text-slate-500">Data final</span>
              <CompactDateInput
                aria-label="Data final das cobranças"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </div>
          <Button
            className="min-h-9 w-full min-[641px]:w-auto"
            variant="secondary"
            type="button"
            onClick={applyCustomPeriod}
          >
            Filtrar período
          </Button>
          <div className="min-w-0 self-center">
            {periodError ? (
              <span className="text-[10px] text-rose-600">{periodError}</span>
            ) : customPeriod ? (
              <span className="text-[10px] text-violet-700">
                Exibindo quem deve pagar entre {date(customPeriod.from)} e {date(customPeriod.to)}.
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Escolha duas datas para calcular o valor previsto e listar as pessoas.</span>
            )}
          </div>
        </div>
        {!items && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {items && filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma cobrança neste período"
            description="Escolha outro filtro para consultar a agenda financeira."
          />
        ) : null}
        {filtered.length ? (
          <div className="collection-table-head sticky top-0 z-[2] hidden grid-cols-[64px_minmax(160px,1fr)_minmax(150px,.9fr)_minmax(115px,.6fr)_176px] items-center gap-[11px] bg-white px-[22px] pb-2.5 pt-[13px] text-[10px] font-bold uppercase tracking-[.45px] text-[#9a95a2] min-[1051px]:grid min-[1121px]:grid-cols-[72px_minmax(190px,1.15fr)_minmax(180px,1fr)_minmax(135px,.65fr)_198px] min-[1121px]:gap-[14px] [&>span:nth-child(4)]:text-center [&>span:nth-child(5)]:text-center">
            <span>Vencimento</span>
            <span>Cliente</span>
            <span>Cobrança</span>
            <span>Valor a receber</span>
            <span>Ações</span>
          </div>
        ) : null}
        <div className="collection-list grid gap-[9px] px-[7px] pb-2 min-[641px]:p-[9px] min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain min-[1051px]:block min-[1051px]:px-3 min-[1051px]:pb-3 min-[1051px]:pt-0">
          {filtered.map((item) => (
            <article
              className={`collection-card grid grid-cols-[48px_minmax(0,1fr)] [grid-template-areas:'date_customer'_'charge_charge'_'total_total'_'actions_actions'] items-center gap-[11px] rounded-[11px] border p-[13px] min-[641px]:grid-cols-[52px_minmax(0,1fr)_minmax(140px,auto)] min-[641px]:[grid-template-areas:'date_customer_total'_'date_charge_total'_'._actions_actions'] min-[641px]:gap-x-3 min-[641px]:gap-y-2 min-[641px]:p-[14px] min-[1051px]:grid-cols-[64px_minmax(160px,1fr)_minmax(150px,.9fr)_minmax(115px,.6fr)_176px] min-[1051px]:[grid-template-areas:none] min-[1051px]:gap-[11px] min-[1051px]:rounded-none min-[1051px]:border-x-0 min-[1051px]:border-b-0 min-[1051px]:bg-white min-[1051px]:px-2.5 min-[1051px]:py-[14px] min-[1121px]:grid-cols-[72px_minmax(190px,1.15fr)_minmax(180px,1fr)_minmax(135px,.65fr)_198px] min-[1121px]:gap-[14px] ${item.status === "OVERDUE" ? "is-overdue border-rose-200 bg-[#fffafb] min-[1051px]:my-[5px] min-[1051px]:rounded-[11px] min-[1051px]:border" : "border-[#ece9f0] bg-white"}`}
              key={item.id}
            >
              <div
                className={`collection-date [grid-area:date] flex h-11 w-[42px] flex-col items-center justify-center rounded-[9px] border min-[641px]:self-start min-[1051px]:[grid-area:auto] min-[1051px]:self-center ${item.status === "OVERDUE" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-[#e7e2f0] bg-[#f5f2ff] text-[#6342ca]"}`}
              >
                <span className="text-sm font-extrabold leading-none">
                  {new Date(item.dueDate)
                    .getUTCDate()
                    .toString()
                    .padStart(2, "0")}
                </span>
                <small className="mt-1 text-[7px] font-bold uppercase">
                  {new Intl.DateTimeFormat("pt-BR", {
                    month: "short",
                    timeZone: "UTC",
                  })
                    .format(new Date(item.dueDate))
                    .replace(".", "")}
                </small>
              </div>
              <div className="collection-customer [grid-area:customer] flex min-w-0 items-center gap-2.5 min-[1051px]:[grid-area:auto]">
                <Avatar name={item.customer.name} />
                <div className="flex min-w-0 flex-col">
                  <strong className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">
                    {item.customer.name}
                  </strong>
                  <span className="mt-1 flex items-center gap-1 text-[10.5px] text-[#98939e]">
                    <Phone className="shrink-0" size={13} />{" "}
                    {formatPhone(item.customer.phone) || "Telefone não informado"}
                  </span>
                </div>
              </div>
              <div className="collection-charge [grid-area:charge] flex min-w-0 flex-col pt-0.5 min-[1051px]:[grid-area:auto] min-[1051px]:pt-0">
                <div className="flex flex-wrap items-center gap-[7px]">
                  <strong className="text-[13px]">{item.label}</strong>
                  <StatusBadge status={item.status} />
                </div>
                {item.lateFee > 0 ? (
                  <span className="danger-text mt-[5px] text-[10.5px] leading-snug text-rose-500">
                    {item.daysOverdue} dia{item.daysOverdue === 1 ? "" : "s"} ·
                    juros {money(item.lateFee)}
                  </span>
                ) : item.paidAmount > 0 ? (
                  <span className="mt-[5px] text-[10.5px] leading-snug text-[#918c98]">
                    Já recebido: {money(item.paidAmount)}
                  </span>
                ) : null}
              </div>
              <div className="collection-total [grid-area:total] grid w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-[9px] bg-[#f7f5fa] px-3 py-2.5 text-left min-[641px]:flex min-[641px]:w-auto min-[641px]:flex-col min-[641px]:items-end min-[641px]:justify-center min-[641px]:bg-transparent min-[641px]:p-0 min-[641px]:text-right min-[1051px]:[grid-area:auto] min-[1051px]:items-center min-[1051px]:text-center">
                <span className="col-start-1 text-[10.5px] text-[#8e8996] min-[1051px]:hidden">
                  A receber
                </span>
                <strong className="col-start-2 row-span-2 row-start-1 m-0 text-[17px] text-[#3e3749] min-[641px]:mt-1 min-[641px]:text-base">
                  {money(item.updatedAmount)}
                </strong>
                {item.lateFee > 0 ? (
                  <small className="col-start-1 text-[9px] text-[#a19ca6] min-[641px]:mt-[3px] min-[641px]:text-right">
                    Parcela {money(item.outstanding)} + juros
                  </small>
                ) : item.paidAmount > 0 ? (
                  <small className="col-start-1 text-[9px] text-[#a19ca6] min-[641px]:mt-[3px] min-[641px]:text-right">
                    Original {money(item.originalAmount)}
                  </small>
                ) : null}
              </div>
              <div className="collection-actions [grid-area:actions] grid grid-cols-[44px_minmax(0,1fr)] items-center justify-stretch gap-[7px] min-[1051px]:[grid-area:auto] min-[1051px]:flex min-[1051px]:justify-end">
                {item.customer.phone ? (
                  <a
                    className="icon-button inline-grid size-10 place-items-center rounded-[10px] border border-[#e9e5ee] bg-white p-0 text-emerald-600 transition hover:bg-emerald-50"
                    href={`https://wa.me/${whatsappPhone(item.customer.phone)}?text=${encodeURIComponent(reminderText(item))}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Enviar lembrete para ${item.customer.name}`}
                  >
                    <MessageCircle size={18} />
                  </a>
                ) : (
                  <button
                    className="icon-button inline-grid size-10 cursor-not-allowed place-items-center rounded-[10px] border border-[#e9e5ee] bg-slate-50 p-0 text-slate-300"
                    type="button"
                    disabled
                    aria-label={`${item.customer.name} não possui telefone cadastrado`}
                    title="Telefone não informado"
                  >
                    <MessageCircle size={18} />
                  </button>
                )}
                <Button className="w-full" onClick={() => onPayment(item)}>
                  <CircleDollarSign size={17} /> Receber
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
