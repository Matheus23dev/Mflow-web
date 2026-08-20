import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Filter,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { chargeValues } from "@/shared/lib/charges";
import { date, formatPhone, money, todayInput } from "@/shared/lib/format";
import {
  paymentMethodSummary,
  paymentsForCharge,
  pixReceiptsForPayments,
} from "@/shared/lib/payments";
import type { Customer, Loan, LoanStatus, LoanType } from "@/shared/types";
import {
  Avatar,
  Button,
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
import { useLoans } from "../hooks/useLoans";
import { loansService } from "../services/loans.service";
import { LoanProgress } from "../components/LoanProgress";
import { customersService } from "@/features/customers/services/customers.service";
import { ReceiptList } from "@/features/receipts/components/ReceiptList";
import { ReceiptOpenButton } from "@/features/receipts/components/ReceiptOpenButton";
import { ReceiptUploadField } from "@/features/receipts/components/ReceiptUploadField";
import { receiptsService } from "@/features/receipts/services/receipts.service";

const formGridClass = "grid min-w-0 grid-cols-1 gap-4 min-[641px]:grid-cols-2";
const fieldSpanClass = "min-w-0 min-[641px]:col-span-2";
const formActionsClass =
  "grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 min-[421px]:flex min-[421px]:justify-end [&>button]:w-full min-[421px]:[&>button]:w-auto";
const formErrorClass =
  "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-700";
const contractPreviewClass =
  "grid min-w-0 grid-cols-1 gap-1 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-xs text-slate-500 min-[421px]:grid-cols-[minmax(0,1fr)_auto] min-[421px]:items-center [&>span]:min-w-0 [&>strong]:break-words [&>strong]:text-base [&>strong]:text-violet-700 [&>small]:min-w-0 [&>small]:break-words min-[421px]:[&>small]:col-span-2";
const typePickerClass =
  "grid min-w-0 grid-cols-1 gap-2 min-[641px]:grid-cols-2";
const typeButtonBaseClass =
  "flex min-h-[74px] min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition [&>span]:grid [&>span]:size-10 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-xl [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_strong]:text-xs [&_small]:mt-1 [&_small]:break-words [&_small]:text-[10px] [&_small]:leading-relaxed";
const typeButtonClass = (selected: boolean) =>
  `${typeButtonBaseClass} ${selected ? "border-violet-400 bg-violet-50 text-violet-700 ring-2 ring-violet-100 [&>span]:bg-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 [&>span]:bg-slate-50 [&_small]:text-slate-500"}`;

function futureDateInput(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function LoanFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (loan: Loan, receiptWarning?: string) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [type, setType] = useState<LoanType>("WEEKLY");
  const [principal, setPrincipal] = useState("");
  const [installments, setInstallments] = useState("10");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [rate, setRate] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open)
      customersService
        .list()
        .then(setCustomers)
        .catch((caught) => setError(caught.message));
  }, [open]);

  const total = useMemo(
    () => Number(installments || 0) * Number(installmentAmount || 0),
    [installments, installmentAmount],
  );
  const monthlyInterest = useMemo(
    () => (Number(principal || 0) * Number(rate || 0)) / 100,
    [principal, rate],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    const numeric = (name: string) => Number(data.get(name));
    try {
      const created = await loansService.create({
        customerId: data.get("customerId"),
        description: data.get("description"),
        type,
        principalAmount: numeric("principalAmount"),
        lateFeePerDay: numeric("lateFeePerDay"),
        loanDate: data.get("loanDate"),
        ...(type === "WEEKLY"
          ? {
              frequency: data.get("frequency"),
              installmentCount: numeric("installmentCount"),
              installmentAmount: numeric("installmentAmount"),
              firstDueDate: data.get("firstDueDate"),
            }
          : {
              monthlyDueDay: numeric("monthlyDueDay"),
              monthlyInterestRate: numeric("monthlyInterestRate"),
            }),
      });
      let receiptWarning: string | undefined;
      if (receiptFile) {
        try {
          await receiptsService.upload(
            created.id,
            receiptFile,
            "LOAN_DISBURSEMENT",
          );
        } catch (caught) {
          receiptWarning = `Empréstimo criado, mas o comprovante não foi salvo: ${caught instanceof Error ? caught.message : "erro no armazenamento"}`;
        }
      }
      onCreated(created, receiptWarning);
      onClose();
      setPrincipal("");
      setInstallmentAmount("");
      setRate("");
      setReceiptFile(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o empréstimo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo empréstimo"
      description="Defina o cliente e as condições do contrato."
      size="lg"
    >
      {customers.length === 0 && !error ? (
        <EmptyState
          title="Cadastre um cliente primeiro"
          description="Um empréstimo precisa estar vinculado a um cliente da carteira."
        />
      ) : (
        <form onSubmit={submit} className={`${formGridClass} loan-form`}>
          <div
            className={`${fieldSpanClass} ${typePickerClass} loan-type-picker`}
          >
            <button
              type="button"
              className={typeButtonClass(type === "WEEKLY")}
              onClick={() => setType("WEEKLY")}
            >
              <span>
                <CalendarDays size={19} />
              </span>
              <div>
                <strong>Parcelado</strong>
                <small>Parcelas semanais, quinzenais ou mensais</small>
              </div>
            </button>
            <button
              type="button"
              className={typeButtonClass(type === "MONTHLY_INTEREST")}
              onClick={() => setType("MONTHLY_INTEREST")}
            >
              <span>
                <CircleDollarSign size={19} />
              </span>
              <div>
                <strong>Juros mensal</strong>
                <small>Juros recorrentes com principal em aberto</small>
              </div>
            </button>
          </div>
          <div className={fieldSpanClass}>
            <Field label="Cliente">
              <Select name="customerId" required defaultValue="">
                <option value="" disabled>
                  Selecione um cliente
                </option>
                {customers.map((customer) => (
                  <option value={customer.id} key={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Valor principal">
            <Input
              name="principalAmount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              placeholder="0,00"
            />
          </Field>
          <Field label="Data do empréstimo">
            <Input
              name="loanDate"
              type="date"
              defaultValue={todayInput()}
              required
            />
          </Field>
          <Field label="Multa por dia">
            <Input
              name="lateFeePerDay"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
            />
          </Field>
          {type === "WEEKLY" ? (
            <>
              <Field label="Frequência">
                <Select name="frequency" defaultValue="WEEKLY">
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                  <option value="MONTHLY">Mensal</option>
                </Select>
              </Field>
              <Field label="Quantidade de parcelas">
                <Input
                  name="installmentCount"
                  type="number"
                  min="1"
                  required
                  value={installments}
                  onChange={(event) => setInstallments(event.target.value)}
                />
              </Field>
              <Field label="Valor da parcela">
                <Input
                  name="installmentAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={installmentAmount}
                  onChange={(event) => setInstallmentAmount(event.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Primeiro vencimento">
                <Input name="firstDueDate" type="date" required />
              </Field>
              <div
                className={`${fieldSpanClass} ${contractPreviewClass} contract-preview`}
              >
                <span>Total contratado</span>
                <strong>{money(total)}</strong>
                <small>
                  {installments || 0} parcelas de {money(installmentAmount)}
                </small>
              </div>
            </>
          ) : (
            <>
              <Field label="Taxa de juros ao mês">
                <Input
                  name="monthlyInterestRate"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  required
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  placeholder="Ex.: 8"
                />
              </Field>
              <Field label="Dia do vencimento">
                <Input
                  name="monthlyDueDay"
                  type="number"
                  min="1"
                  max="31"
                  required
                  defaultValue="10"
                />
              </Field>
              <div
                className={`${fieldSpanClass} ${contractPreviewClass} contract-preview`}
              >
                <span>Juros mensal estimado</span>
                <strong>{money(monthlyInterest)}</strong>
                <small>
                  Taxa de {Number(rate || 0).toLocaleString("pt-BR")}% sobre{" "}
                  {money(principal)}
                </small>
              </div>
            </>
          )}
          <div className={fieldSpanClass}>
            <Field
              label="Descrição do empréstimo"
              hint="Opcional. Use para registrar o motivo, combinado ou uma observação importante."
            >
              <Textarea
                name="description"
                maxLength={1000}
                placeholder="Ex.: capital para compra de mercadoria; pagamento combinado toda sexta-feira."
              />
            </Field>
          </div>
          <div className={fieldSpanClass}>
            <ReceiptUploadField
              label="Comprovante do dinheiro emprestado"
              file={receiptFile}
              onChange={setReceiptFile}
            />
          </div>
          {error ? (
            <div className={`${fieldSpanClass} ${formErrorClass} form-error`}>
              {error}
            </div>
          ) : null}
          <div className={`${fieldSpanClass} ${formActionsClass} form-actions`}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Criar empréstimo
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function EditLoanModal({
  loan,
  onClose,
  onSaved,
}: {
  loan: Loan | null;
  onClose: () => void;
  onSaved: (updatedLoan: Loan) => void;
}) {
  const [principalAmount, setPrincipalAmount] = useState(
    () => loan?.principalAmount || "",
  );
  const [principalBalance, setPrincipalBalance] = useState(
    () => loan?.principalBalance || loan?.principalAmount || "",
  );
  const [lateFeePerDay, setLateFeePerDay] = useState(
    () => loan?.lateFeePerDay || "0",
  );
  const [description, setDescription] = useState(() => loan?.description || "");
  const [frequency, setFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">(
    () => loan?.frequency || "WEEKLY",
  );
  const [installmentCount, setInstallmentCount] = useState(
    () => loan?.installmentCount?.toString() || "10",
  );
  const [installmentAmount, setInstallmentAmount] = useState(
    () => loan?.installmentAmount?.toString() || "",
  );
  const [firstDueDate, setFirstDueDate] = useState(() =>
    loan?.firstDueDate ? loan.firstDueDate.split("T")[0] : "",
  );
  const [monthlyDueDay, setMonthlyDueDay] = useState(
    () => loan?.monthlyDueDay?.toString() || "10",
  );
  const [rateMode, setRateMode] = useState<"percentage" | "fixed">(() =>
    loan?.monthlyInterestAmount && !loan.monthlyInterestRate
      ? "fixed"
      : "percentage",
  );
  const [monthlyInterestRate, setMonthlyInterestRate] = useState(
    () => loan?.monthlyInterestRate?.toString() || "",
  );
  const [monthlyInterestAmount, setMonthlyInterestAmount] = useState(
    () => loan?.monthlyInterestAmount?.toString() || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!loan) return null;

  const isWeekly = loan.type === "WEEKLY";
  const hasPayments =
    (loan.summary?.paidCount || 0) > 0 || (loan.payments?.length || 0) > 0;
  const paidCount = loan.summary?.paidCount || 0;
  const paidAmountTotal = loan.installments
    ? loan.installments
        .filter((i) => i.status === "PAID" || Number(i.paidAmount) > 0)
        .reduce((sum, i) => sum + Number(i.paidAmount || i.amount || 0), 0)
    : 0;

  const totalCalculated = isWeekly
    ? Number(installmentCount || 0) * Number(installmentAmount || 0)
    : Number(principalBalance || principalAmount || 0);
  const remainingInstallmentsCount = isWeekly
    ? Math.max(0, Number(installmentCount || 0) - paidCount)
    : 0;
  const remainingBalanceCalculated = isWeekly
    ? remainingInstallmentsCount * Number(installmentAmount || 0)
    : Number(principalBalance || 0);
  const monthlyInterestCalculated = isWeekly
    ? 0
    : rateMode === "percentage"
      ? (Number(principalBalance || principalAmount || 0) *
          Number(monthlyInterestRate || 0)) /
        100
      : Number(monthlyInterestAmount || 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loan) return;
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      principalAmount: Number(principalAmount),
      lateFeePerDay: Number(lateFeePerDay),
      description,
    };

    if (isWeekly) {
      body.frequency = frequency;
      body.installmentCount = Number(installmentCount);
      body.installmentAmount = Number(installmentAmount);
      body.firstDueDate = firstDueDate;
    } else {
      body.principalBalance = Number(principalBalance);
      body.monthlyDueDay = Number(monthlyDueDay);
      if (rateMode === "percentage") {
        body.monthlyInterestRate = Number(monthlyInterestRate);
      } else {
        body.monthlyInterestAmount = Number(monthlyInterestAmount);
      }
    }

    try {
      const updated = await loansService.update(loan.id, body);
      onSaved(updated);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível editar o empréstimo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(loan)}
      onClose={onClose}
      title="Editar empréstimo"
      description={`Contrato de ${loan.customer.name}`}
      size="lg"
    >
      <form onSubmit={submit} className={`${formGridClass} loan-form`}>
        {hasPayments ? (
          <div
            className={`${fieldSpanClass} form-info-box rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900`}
          >
            <strong>Atenção ao renegociar:</strong> Este contrato possui
            pagamentos registrados ({paidCount} cobrança(s) já paga(s)
            totalizando {money(paidAmountTotal)}). O histórico pago é mantido e
            os novos valores serão aplicados às parcelas/cobranças futuras.
          </div>
        ) : null}

        <Field label="Valor Principal Inicial">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
          />
        </Field>
        {isWeekly ? null : (
          <Field label="Saldo Devedor Principal Atual">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={principalBalance}
              onChange={(e) => setPrincipalBalance(e.target.value)}
            />
          </Field>
        )}
        <Field label="Multa por dia de atraso">
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={lateFeePerDay}
            onChange={(e) => setLateFeePerDay(e.target.value)}
          />
        </Field>

        {isWeekly ? (
          <>
            <Field label="Frequência">
              <Select
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
                  )
                }
              >
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quinzenal</option>
                <option value="MONTHLY">Mensal</option>
              </Select>
            </Field>
            <Field label="Quantidade total de parcelas">
              <Input
                type="number"
                min={Math.max(1, paidCount)}
                required
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
              />
            </Field>
            <Field label="Valor da parcela">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Primeiro vencimento">
              <Input
                type="date"
                required
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </Field>
            <div
              className={`${fieldSpanClass} ${contractPreviewClass} contract-preview`}
            >
              <span>
                Total contratado estimado:{" "}
                <strong>{money(totalCalculated)}</strong> (
                {installmentCount || 0} parcelas de {money(installmentAmount)})
              </span>
              <small className="mt-1 block">
                Saldo a pagar restante:{" "}
                <strong>{money(remainingBalanceCalculated)}</strong> (
                {remainingInstallmentsCount} parcelas futuras de{" "}
                {money(installmentAmount)})
              </small>
            </div>
          </>
        ) : (
          <>
            <Field label="Dia do vencimento mensal">
              <Input
                type="number"
                min="1"
                max="31"
                required
                value={monthlyDueDay}
                onChange={(e) => setMonthlyDueDay(e.target.value)}
              />
            </Field>
            <div
              className={`${fieldSpanClass} ${typePickerClass} loan-type-picker`}
            >
              <button
                type="button"
                className={typeButtonClass(rateMode === "percentage")}
                onClick={() => setRateMode("percentage")}
              >
                <div>
                  <strong>Taxa percentual (%)</strong>
                </div>
              </button>
              <button
                type="button"
                className={typeButtonClass(rateMode === "fixed")}
                onClick={() => setRateMode("fixed")}
              >
                <div>
                  <strong>Valor fixo de juros (R$)</strong>
                </div>
              </button>
            </div>
            {rateMode === "percentage" ? (
              <Field label="Taxa de juros ao mês (%)">
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  required
                  value={monthlyInterestRate}
                  onChange={(e) => setMonthlyInterestRate(e.target.value)}
                  placeholder="Ex.: 10"
                />
              </Field>
            ) : (
              <Field label="Valor mensal de juros (R$)">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={monthlyInterestAmount}
                  onChange={(e) => setMonthlyInterestAmount(e.target.value)}
                  placeholder="Ex.: 1000,00"
                />
              </Field>
            )}
            <div
              className={`${fieldSpanClass} ${contractPreviewClass} contract-preview`}
            >
              <span>Juros mensal estimado</span>
              <strong>{money(monthlyInterestCalculated)}</strong>
              <small>
                {rateMode === "percentage"
                  ? `Taxa de ${Number(monthlyInterestRate || 0).toLocaleString("pt-BR")}% sobre o saldo de ${money(principalBalance || principalAmount)}`
                  : `Juros fixos de ${money(monthlyInterestAmount)}`}
              </small>
            </div>
          </>
        )}

        <div className={fieldSpanClass}>
          <Field
            label="Descrição do empréstimo"
            hint="Opcional. A descrição aparece somente nos detalhes do sistema."
          >
            <Textarea
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Adicione uma observação sobre este contrato."
            />
          </Field>
        </div>

        {error ? (
          <div className={`${fieldSpanClass} ${formErrorClass} form-error`}>
            {error}
          </div>
        ) : null}
        <div className={`${fieldSpanClass} ${formActionsClass} form-actions`}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CancelLoanModal({
  loan,
  onClose,
  onCancelled,
}: {
  loan: Loan | null;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  if (!loan) return null;

  async function confirmCancel() {
    if (!loan) return;
    setCancelling(true);
    setError("");
    try {
      await loansService.cancel(loan.id);
      onCancelled();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível cancelar o contrato.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Modal
      open={Boolean(loan)}
      onClose={onClose}
      title="Cancelar contrato"
      description={`Cliente: ${loan.customer.name}`}
      size="sm"
    >
      <div className="flex min-w-0 flex-col gap-3.5">
        <p className="m-0 break-words text-[13px] leading-relaxed text-slate-700">
          Tem certeza de que deseja cancelar este contrato de{" "}
          <strong>{money(loan.summary.openBalance)}</strong>? O contrato passará
          para o status <strong>CANCELADO</strong>.
        </p>
        {error ? (
          <div className={`${formErrorClass} form-error`}>{error}</div>
        ) : null}
        <div className={`${formActionsClass} form-actions cancel-loan-actions`}>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" loading={cancelling} onClick={confirmCancel}>
            Sim, cancelar contrato
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RenewLoanModal({
  loan,
  onClose,
  onRenewed,
}: {
  loan: Loan | null;
  onClose: () => void;
  onRenewed: (receiptWarning?: string) => void;
}) {
  const [entryAmount, setEntryAmount] = useState("0");
  const [newMoneyReleased, setNewMoneyReleased] = useState("");
  const [installmentCount, setInstallmentCount] = useState(
    () => loan?.installmentCount?.toString() || "8",
  );
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [frequency, setFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">(
    () => loan?.frequency || "WEEKLY",
  );
  const [loanDate, setLoanDate] = useState(todayInput());
  const [firstDueDate, setFirstDueDate] = useState(futureDateInput(7));
  const [lateFeePerDay, setLateFeePerDay] = useState(
    () => loan?.lateFeePerDay || "0",
  );
  const [description, setDescription] = useState(() => loan?.description || "");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!loan) return null;

  const previousBalance = Number(loan.summary.openBalance || 0);
  const entry = Number(entryAmount || 0);
  const refinancedAmount = Math.max(0, previousBalance - entry);
  const newMoney = Number(newMoneyReleased || 0);
  const newBase = refinancedAmount + newMoney;
  const newContractTotal =
    Number(installmentCount || 0) * Number(installmentAmount || 0);
  const contractIsEnough = newContractTotal >= newBase && newBase > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loan) return;
    if (entry > previousBalance) {
      setError("A entrada não pode ser maior que o saldo atual.");
      return;
    }
    if (!contractIsEnough) {
      setError(
        "O total das novas parcelas precisa cobrir a base do novo contrato.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const renewed = await loansService.renew(loan.id, {
        entryAmount: entry,
        newMoneyReleased: newMoney,
        installmentCount: Number(installmentCount),
        installmentAmount: Number(installmentAmount),
        lateFeePerDay: Number(lateFeePerDay),
        loanDate,
        firstDueDate,
        frequency,
        paymentMethod,
        description,
      });
      let receiptWarning: string | undefined;
      if (receiptFile) {
        try {
          await receiptsService.upload(renewed.id, receiptFile, "RENEWAL");
        } catch (caught) {
          receiptWarning = `Renovação concluída, mas o comprovante não foi salvo: ${caught instanceof Error ? caught.message : "erro no armazenamento"}`;
        }
      }
      onRenewed(receiptWarning);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível renovar o empréstimo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(loan)}
      onClose={onClose}
      title="Renovar empréstimo"
      description={`Novo contrato para ${loan.customer.name}`}
      size="lg"
    >
      <form className={`${formGridClass} loan-renewal-form`} onSubmit={submit}>
        <div
          className={`${fieldSpanClass} rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600`}
        >
          O saldo restante será levado para um novo contrato. No caixa, será
          registrada como saída somente a quantia adicional entregue ao cliente.
        </div>

        <Field label="Saldo restante das parcelas">
          <Input value={money(previousBalance)} disabled />
        </Field>
        <Field
          label="Entrada na renovação"
          hint="Valor pago agora para reduzir o saldo antigo"
        >
          <Input
            type="number"
            min="0"
            max={previousBalance}
            step="0.01"
            value={entryAmount}
            onChange={(event) => setEntryAmount(event.target.value)}
          />
        </Field>
        <Field
          label="Dinheiro novo entregue"
          hint="Somente este valor será lançado como saída no caixa"
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={newMoneyReleased}
            onChange={(event) => setNewMoneyReleased(event.target.value)}
            placeholder="Ex.: 600,00"
          />
        </Field>
        <Field label="Forma de pagamento da entrada">
          <Select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            disabled={entry <= 0}
          >
            <option value="PIX">Pix</option>
            <option value="CASH">Dinheiro</option>
            <option value="TRANSFER">Transferência</option>
            <option value="OTHER">Outro</option>
          </Select>
        </Field>
        <Field label="Quantidade de novas parcelas">
          <Input
            type="number"
            min="1"
            required
            value={installmentCount}
            onChange={(event) => setInstallmentCount(event.target.value)}
          />
        </Field>
        <Field label="Valor de cada parcela">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={installmentAmount}
            onChange={(event) => setInstallmentAmount(event.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Frequência">
          <Select
            value={frequency}
            onChange={(event) =>
              setFrequency(
                event.target.value as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
              )
            }
          >
            <option value="WEEKLY">Semanal</option>
            <option value="BIWEEKLY">Quinzenal</option>
            <option value="MONTHLY">Mensal</option>
          </Select>
        </Field>
        <Field label="Multa por dia">
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={lateFeePerDay}
            onChange={(event) => setLateFeePerDay(event.target.value)}
          />
        </Field>
        <Field label="Data da renovação">
          <Input
            type="date"
            required
            value={loanDate}
            onChange={(event) => setLoanDate(event.target.value)}
          />
        </Field>
        <Field label="Primeiro vencimento">
          <Input
            type="date"
            min={loanDate}
            required
            value={firstDueDate}
            onChange={(event) => setFirstDueDate(event.target.value)}
          />
        </Field>
        <div className={fieldSpanClass}>
          <Field
            label="Descrição do novo empréstimo"
            hint="Opcional. Você poderá editar essa descrição depois."
          >
            <Textarea
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Adicione uma observação sobre a renovação."
            />
          </Field>
        </div>
        <div className={fieldSpanClass}>
          <ReceiptUploadField
            label="Comprovante do dinheiro novo entregue"
            file={receiptFile}
            onChange={setReceiptFile}
          />
        </div>

        <div
          className={`${fieldSpanClass} grid min-w-0 grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 min-[421px]:grid-cols-2 min-[641px]:grid-cols-3 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_span]:text-[9.5px] [&_span]:text-slate-500 [&_strong]:mt-1 [&_strong]:break-words [&_strong]:text-[13px]`}
        >
          <div>
            <span>Saldo restante das parcelas</span>
            <strong>{money(previousBalance)}</strong>
          </div>
          <div>
            <span>Menos entrada</span>
            <strong>− {money(entry)}</strong>
          </div>
          <div>
            <span>Saldo refinanciado</span>
            <strong>{money(refinancedAmount)}</strong>
          </div>
          <div>
            <span>Dinheiro novo</span>
            <strong>+ {money(newMoney)}</strong>
          </div>
          <div className="rounded-lg bg-violet-100 px-2.5 py-2 text-violet-800">
            <span>Base do novo contrato</span>
            <strong>{money(newBase)}</strong>
          </div>
          <div
            className={`rounded-lg px-2.5 py-2 ${contractIsEnough ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}
          >
            <span>Total das parcelas</span>
            <strong>{money(newContractTotal)}</strong>
          </div>
        </div>

        {!contractIsEnough && installmentAmount ? (
          <p className={`${fieldSpanClass} m-0 text-xs text-rose-600`}>
            O total das parcelas está {money(newBase - newContractTotal)} abaixo
            da base do novo contrato.
          </p>
        ) : null}
        {error ? (
          <div className={`${fieldSpanClass} ${formErrorClass} form-error`}>
            {error}
          </div>
        ) : null}
        <div className={`${fieldSpanClass} ${formActionsClass} form-actions`}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={!contractIsEnough}>
            <RefreshCw size={17} /> Confirmar renovação
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteLoanModal({
  loan,
  onClose,
  onDeleted,
}: {
  loan: Loan | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!loan) return null;

  async function confirmDelete() {
    if (!loan) return;
    setDeleting(true);
    setError("");
    try {
      await loansService.remove(loan.id);
      onDeleted();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir o empréstimo.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={Boolean(loan)}
      onClose={onClose}
      title="Excluir empréstimo"
      description={`Cliente: ${loan.customer.name}`}
      size="sm"
    >
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] leading-relaxed text-rose-800">
          <strong className="mb-1 block">Esta ação é permanente.</strong>O
          contrato de <strong>{money(loan.principalAmount)}</strong>, suas
          cobranças, pagamentos e movimentações de caixa vinculadas serão
          excluídos. Não será possível recuperar esses dados.
        </div>
        {error ? (
          <div className={`${formErrorClass} form-error`}>{error}</div>
        ) : null}
        <div className={`${formActionsClass} form-actions`}>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            <Trash2 size={17} /> Excluir permanentemente
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function LoansPage({
  refreshKey,
  onNewLoan,
  onPayment,
  onReport,
  onSaved,
  onWarning,
}: {
  refreshKey: number;
  onNewLoan: () => void;
  onPayment: (loan: Loan) => void;
  onReport: (loan: Loan) => void;
  onSaved?: (message: string) => void;
  onWarning?: (message: string) => void;
}) {
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [type, setType] = useState<LoanType | "">("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [cancellingLoan, setCancellingLoan] = useState<Loan | null>(null);
  const [renewingLoan, setRenewingLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);
  const { loans, error, reload: load } = useLoans(status, type, refreshKey);

  const filtered = useMemo(
    () =>
      loans?.filter((loan) => {
        const term = search.toLowerCase();
        return (
          loan.customer.name.toLowerCase().includes(term) ||
          loan.description?.toLowerCase().includes(term)
        );
      }) || [],
    [loans, search],
  );

  return (
    <div className="page-enter data-page loans-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow="Carteira"
        title="Empréstimos"
        description="Acompanhe contratos, saldos e andamento dos pagamentos."
        action={
          <Button onClick={onNewLoan}>
            <Plus size={18} /> Novo empréstimo
          </Button>
        }
      />
      <section className="panel table-panel min-w-0 overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:flex-col">
        <div className="list-toolbar loan-toolbar flex min-w-0 flex-col items-stretch justify-between gap-3.5 border-b border-[#eeecf1] px-[18px] py-[14px] min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center">
          <div className="search-box flex h-[43px] w-full min-w-0 items-center gap-[9px] rounded-[9px] border border-[#e6e3ea] bg-[#faf9fc] px-[11px] text-[#9b97a3] focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100 min-[641px]:w-[min(320px,100%)]">
            <Search className="shrink-0" size={18} />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#373340] outline-none placeholder:text-[#aaa6b1] min-[641px]:text-[13px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente ou descrição"
            />
          </div>
          <div className="toolbar-filters grid min-w-0 grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[641px]:flex min-[641px]:w-auto min-[641px]:items-center [&>svg]:hidden min-[641px]:[&>svg]:block [&_[data-ui=input]]:w-full min-[641px]:[&_[data-ui=input]]:w-[150px]">
            <Filter className="shrink-0 text-[#8d8895]" size={16} />
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as LoanStatus | "")
              }
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Em dia</option>
              <option value="OVERDUE">Em atraso</option>
              <option value="PAID">Pagos</option>
              <option value="RENEWED">Renovados</option>
              <option value="CANCELLED">Cancelados</option>
            </Select>
            <Select
              value={type}
              onChange={(event) => setType(event.target.value as LoanType | "")}
            >
              <option value="">Todos os tipos</option>
              <option value="WEEKLY">Parcelado</option>
              <option value="MONTHLY_INTEREST">Juros mensal</option>
            </Select>
          </div>
        </div>
        {!loans && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loans && filtered.length === 0 ? (
          <EmptyState
            title="Nenhum empréstimo por aqui"
            description="Crie um novo contrato ou ajuste os filtros da lista."
            action={
              !loans.length ? (
                <Button onClick={onNewLoan}>
                  <Plus size={17} /> Criar empréstimo
                </Button>
              ) : undefined
            }
          />
        ) : null}
        <div className="loan-list grid min-w-0 auto-rows-max content-start gap-2 px-1.5 pb-2 min-[641px]:px-3 min-[641px]:pb-3 min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain">
          {filtered.map((loan) => {
            const progress = loan.summary.totalCount
              ? (loan.summary.paidCount / loan.summary.totalCount) * 100
              : ((Number(loan.principalAmount) -
                  Number(loan.principalBalance)) /
                  Number(loan.principalAmount)) *
                100;
            const charges =
              loan.type === "WEEKLY" ? loan.installments : loan.monthlyCharges;
            const isOpen = expanded === loan.id;
            return (
              <article
                className={`loan-card min-h-[62px] min-w-0 overflow-hidden rounded-xl border bg-white transition ${isOpen ? "expanded border-violet-200 shadow-[0_8px_24px_rgba(78,53,130,.08)]" : "border-[#ebe8ef]"}`}
                key={loan.id}
              >
                <button
                  className="loan-main grid min-h-[58px] w-full min-w-0 grid-cols-[35px_minmax(0,1fr)_minmax(78px,auto)_17px] items-center gap-2.5 border-0 bg-transparent px-3 py-3 text-left text-[#3b3642] min-[641px]:grid-cols-[35px_minmax(140px,1fr)_minmax(90px,.7fr)_minmax(85px,.6fr)_18px] min-[641px]:gap-3 min-[641px]:px-4 min-[861px]:grid-cols-[36px_minmax(140px,1.2fr)_minmax(115px,.75fr)_minmax(100px,.7fr)_minmax(95px,.6fr)_18px]"
                  onClick={() => setExpanded(isOpen ? null : loan.id)}
                >
                  <Avatar name={loan.customer.name} />
                  <div className="loan-person flex min-w-0 flex-col">
                    <strong className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">
                      {loan.customer.name}
                    </strong>
                    <span className="mt-1 flex min-w-0 items-center gap-1 overflow-hidden text-[10.5px] text-[#9995a1] text-ellipsis whitespace-nowrap">
                      <Phone className="shrink-0" size={13} />{" "}
                      {formatPhone(loan.customer.phone) || "Telefone não informado"}
                    </span>
                  </div>
                  <div className="loan-type hidden min-w-0 flex-col min-[861px]:flex">
                    <span className="overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                      {loan.type === "WEEKLY" ? "Parcelado" : "Juros mensal"}
                    </span>
                    <small className="mt-1 overflow-hidden text-[10px] text-[#9b96a2] text-ellipsis whitespace-nowrap">
                      Início em {date(loan.loanDate)}
                    </small>
                  </div>
                  <div className="loan-amount flex min-w-0 flex-col items-end text-right min-[641px]:items-start min-[641px]:text-left">
                    <strong className="max-w-full overflow-hidden text-[13px] text-violet-700 text-ellipsis whitespace-nowrap">
                      {money(loan.principalAmount)}
                    </strong>
                    <span className="mt-1 text-[10px] text-[#9b96a2]">
                      valor emprestado
                    </span>
                  </div>
                  <div className="loan-status hidden min-w-0 flex-col items-start min-[641px]:flex">
                    {" "}
                    <StatusBadge status={loan.status} />
                    {loan.summary.nextDue ? (
                      <small className="mt-1 text-[10px] text-[#9b96a2]">
                        Próx. {date(loan.summary.nextDue)}
                      </small>
                    ) : null}
                  </div>
                  {isOpen ? (
                    <ChevronDown
                      className="shrink-0 text-[#aaa6b1]"
                      size={19}
                    />
                  ) : (
                    <ChevronRight
                      className="shrink-0 text-[#aaa6b1]"
                      size={19}
                    />
                  )}
                </button>
                <LoanProgress value={progress} />
                {isOpen ? (
                  <div className="loan-detail min-w-0 border-t border-[#efedf2] bg-[#fdfcff] px-3 pb-4 pt-3 min-[641px]:px-4">
                    {loan.description ? (
                      <div className="mb-3 min-w-0 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 text-xs leading-5 text-slate-700">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                          Descrição
                        </span>
                        <p className="m-0 whitespace-pre-wrap break-words">
                          {loan.description}
                        </p>
                      </div>
                    ) : null}
                    <div className="loan-detail-stats mb-4 grid min-w-0 grid-cols-2 gap-2 min-[641px]:grid-cols-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:rounded-[10px] [&>div]:bg-white [&>div]:px-3 [&>div]:py-2.5 [&_span]:text-[10px] [&_span]:text-[#9995a1] [&_strong]:mt-1 [&_strong]:break-words [&_strong]:text-xs">
                      <div>
                        <span>Valor principal</span>
                        <strong>{money(loan.principalAmount)}</strong>
                      </div>
                      <div>
                        <span>Total recebido</span>
                        <strong>{money(loan.summary.received)}</strong>
                      </div>
                      <div>
                        <span>Multas acumuladas</span>
                        <strong>{money(loan.summary.lateFees)}</strong>
                      </div>
                      <div>
                        <span>Andamento</span>
                        <strong>
                          {loan.summary.paidCount}/{loan.summary.totalCount}{" "}
                          cobranças
                        </strong>
                      </div>
                    </div>
                    <div className="schedule-head mb-3 flex min-w-0 flex-col gap-3 min-[641px]:flex-row min-[641px]:items-center min-[641px]:justify-between">
                      <strong>Agenda do contrato</strong>
                      <div className="loan-detail-actions grid w-full min-w-0 grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[641px]:flex min-[641px]:w-auto min-[641px]:flex-wrap min-[641px]:justify-end [&>button]:w-full min-[641px]:[&>button]:w-auto min-[641px]:[&>button]:min-h-9 min-[641px]:[&>button]:px-3 min-[641px]:[&>button]:py-2 min-[641px]:[&>button]:text-xs">
                        <Button
                          variant="secondary"
                          onClick={() => onReport(loan)}
                        >
                          <FileText size={17} /> Relatório
                        </Button>
                        {["ACTIVE", "OVERDUE"].includes(loan.status) ? (
                          <Button
                            variant="secondary"
                            onClick={() => setEditingLoan(loan)}
                          >
                            <Pencil size={17} /> Editar contrato
                          </Button>
                        ) : null}
                        {loan.type === "WEEKLY" &&
                        ["ACTIVE", "OVERDUE"].includes(loan.status) ? (
                          <Button
                            variant="secondary"
                            onClick={() => setRenewingLoan(loan)}
                          >
                            <RefreshCw size={17} /> Renovar
                          </Button>
                        ) : null}
                        {["ACTIVE", "OVERDUE"].includes(loan.status) ? (
                          <Button
                            variant="secondary"
                            onClick={() => setCancellingLoan(loan)}
                          >
                            <Ban size={17} /> Cancelar
                          </Button>
                        ) : null}
                        {["ACTIVE", "OVERDUE"].includes(loan.status) ? (
                          <Button onClick={() => onPayment(loan)}>
                            <CircleDollarSign size={17} /> Registrar pagamento
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          onClick={() => setDeletingLoan(loan)}
                        >
                          <Trash2 size={17} /> Excluir
                        </Button>
                      </div>
                    </div>
                    <div className="schedule-grid grid min-w-0 grid-cols-1 gap-2 min-[641px]:grid-cols-2 min-[861px]:grid-cols-3">
                      {charges.slice(0, 12).map((charge) => {
                        const values = chargeValues(charge, loan.lateFeePerDay);
                        const hasLateFee = values.lateFee > 0;
                        const chargePayments = paymentsForCharge(loan, charge);
                        const paymentMethod =
                          paymentMethodSummary(chargePayments);
                        const pixReceipts = pixReceiptsForPayments(
                          loan,
                          chargePayments,
                        );

                        return (
                          <div
                            className={`schedule-item grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border bg-white px-3 py-2.5 ${hasLateFee ? "border-rose-200" : "border-[#ebe8ef]"}`}
                            key={charge.id}
                          >
                            <span
                              className={`text-[10px] font-extrabold ${hasLateFee ? "text-rose-600" : "text-violet-600"}`}
                            >
                              {charge.number
                                ? `#${charge.number}`
                                : charge.referenceMonth}
                            </span>
                            <div className="flex min-w-0 flex-col">
                              <strong className="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                                {money(
                                  hasLateFee
                                    ? values.updatedAmount
                                    : charge.amount || charge.interestAmount,
                                )}
                              </strong>
                              <small className="mt-1 text-[9.5px] text-[#9995a1]">
                                {date(charge.dueDate)}
                              </small>
                              {values.paid > 0 ? (
                                <small className="mt-1 break-words text-[9px] font-semibold leading-snug text-slate-500">
                                  {charge.status === "PARTIAL"
                                    ? "Parcial"
                                    : "Pago"}{" "}
                                  via {paymentMethod || "forma não informada"}
                                </small>
                              ) : null}
                              {hasLateFee ? (
                                <small className="mt-1 break-words text-[9px] font-semibold leading-snug text-rose-600">
                                  +{money(values.lateFee)} juros (
                                  {values.overdue}d)
                                </small>
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-col items-end gap-1">
                              <StatusBadge status={charge.status} />
                              {pixReceipts.length ? (
                                <div className="flex flex-wrap justify-end gap-1">
                                  {pixReceipts.map((receipt) => (
                                    <ReceiptOpenButton
                                      key={receipt.id}
                                      receipt={receipt}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <ReceiptList loan={loan} onChanged={load} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <EditLoanModal
        key={editingLoan?.id || "closed"}
        loan={editingLoan}
        onClose={() => setEditingLoan(null)}
        onSaved={() => {
          load();
          onSaved?.("Empréstimo atualizado com sucesso.");
        }}
      />
      <CancelLoanModal
        loan={cancellingLoan}
        onClose={() => setCancellingLoan(null)}
        onCancelled={() => {
          load();
          onSaved?.("Contrato cancelado.");
        }}
      />
      <RenewLoanModal
        key={renewingLoan?.id || "closed"}
        loan={renewingLoan}
        onClose={() => setRenewingLoan(null)}
        onRenewed={(receiptWarning) => {
          setExpanded(null);
          load();
          if (receiptWarning) onWarning?.(receiptWarning);
          else onSaved?.("Empréstimo renovado e nova agenda criada.");
        }}
      />
      <DeleteLoanModal
        loan={deletingLoan}
        onClose={() => setDeletingLoan(null)}
        onDeleted={() => {
          setExpanded(null);
          load();
          onSaved?.("Empréstimo excluído permanentemente.");
        }}
      />
    </div>
  );
}
