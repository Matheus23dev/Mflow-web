import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  Landmark,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { date, money } from "@/shared/lib/format";
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
  Textarea,
} from "@/shared/ui";
import { useCash } from "../hooks/useCash";
import { cashService } from "../services/cash.service";
import { CashMetricCard } from "../components/CashMetricCard";

function todayInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const formGridClass =
  "form-grid grid grid-cols-1 gap-[15px] min-[641px]:grid-cols-2 [&>*]:min-w-0";
const fieldSpanClass = "field-span min-[641px]:col-span-2";
const formActionsClass =
  "form-actions -mx-[17px] -mb-[18px] mt-[3px] flex flex-col-reverse justify-end gap-2 border-t border-[#ebe8ee] bg-[#fbfafd] px-[17px] py-[13px] min-[421px]:flex-row min-[641px]:-mx-[22px] min-[641px]:-mb-[22px] min-[641px]:mt-1 min-[641px]:px-[22px] min-[641px]:py-[14px] max-[420px]:[&>[data-ui=button]]:w-full";

export function CashPage({
  refreshKey,
  onSaved,
}: {
  refreshKey: number;
  onSaved: (message: string) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayInput());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data,
    error: pageError,
    reload: load,
  } = useCash(from, to, refreshKey);

  const transactions = useMemo(
    () =>
      data?.transactions.filter(
        (item) =>
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.loan?.customer.name.toLowerCase().includes(search.toLowerCase()),
      ) || [],
    [data, search],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await cashService.create({
        type,
        amount: Number(amount),
        description,
        transactionDate,
      });
      setModalOpen(false);
      setAmount("");
      setDescription("");
      setTransactionDate(todayInput());
      onSaved(
        type === "INCOME"
          ? "Entrada adicionada ao caixa."
          : "Retirada registrada no caixa.",
      );
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar a movimentação.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-enter data-page cash-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow="Movimentação"
        title="Fluxo de caixa"
        description="Acompanhe entradas, retiradas e movimentações dos contratos."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Nova movimentação
          </Button>
        }
      />

      <div className="cash-metrics mb-[17px] grid grid-cols-1 gap-[9px] min-[641px]:grid-cols-3 min-[641px]:gap-[15px]">
        <CashMetricCard
          tone="purple"
          icon={<Wallet size={22} />}
          label="Saldo do período"
          value={money(data?.summary.balance)}
        />
        <CashMetricCard
          tone="green"
          icon={<ArrowDownLeft size={22} />}
          label="Entradas"
          value={money(data?.summary.income)}
        />
        <CashMetricCard
          tone="red"
          icon={<ArrowUpRight size={22} />}
          label="Saídas"
          value={money(data?.summary.expense)}
        />
      </div>

      <section className="panel table-panel min-w-0 overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:flex-col">
        <div className="list-toolbar cash-toolbar flex min-h-[68px] flex-col items-stretch justify-between gap-[14px] border-b border-[#eeecf1] px-[18px] py-[14px] min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center">
          <div className="search-box flex h-[43px] w-full items-center gap-[9px] rounded-[9px] border border-[#e6e3ea] bg-[#faf9fc] px-[11px] text-[#9b97a3] focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100 min-[641px]:w-[min(360px,100%)]">
            <Search className="shrink-0" size={19} />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#373340] outline-none placeholder:text-[#aaa6b1] min-[641px]:text-[13px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por descrição ou cliente"
            />
          </div>
          <div className="date-range grid w-full min-w-0 grid-cols-2 items-center gap-1.5 text-[#97939f] min-[641px]:flex min-[641px]:w-auto min-[641px]:gap-[7px] [&>svg]:hidden min-[641px]:[&>svg]:block [&>span]:hidden min-[641px]:[&>span]:block [&_[data-ui=input]]:h-9 [&_[data-ui=input]]:min-w-0 [&_[data-ui=input]]:max-w-full [&_[data-ui=input]]:px-1.5 [&_[data-ui=input]]:py-1 [&_[data-ui=input]]:text-[16px] min-[641px]:[&_[data-ui=input]]:h-auto min-[641px]:[&_[data-ui=input]]:w-[132px] min-[641px]:[&_[data-ui=input]]:px-3 min-[641px]:[&_[data-ui=input]]:py-2.5 min-[641px]:[&_[data-ui=input]]:text-sm">
            <CalendarRange className="shrink-0" size={18} />
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="Data inicial"
            />
            <span className="text-[8px]">até</span>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              aria-label="Data final"
            />
          </div>
        </div>
        {!data && !pageError ? <LoadingState /> : null}
        {pageError ? <ErrorState message={pageError} onRetry={load} /> : null}
        {data && transactions.length === 0 ? (
          <EmptyState
            title="Sem movimentações no período"
            description="Adicione uma entrada ou retirada, ou registre um contrato ou pagamento."
            action={
              <Button onClick={() => setModalOpen(true)}>
                Adicionar movimentação
              </Button>
            }
          />
        ) : null}
        <div className="cash-list px-1.5 pb-[7px] min-[641px]:px-3 min-[641px]:pb-3 min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain">
          {transactions.map((transaction) => (
            <article
              className="cash-row grid grid-cols-[35px_minmax(0,1fr)_auto] items-center gap-2 border-t border-[#efedf2] px-1.5 py-3 min-[641px]:grid-cols-[35px_minmax(180px,1.3fr)_minmax(85px,.55fr)_65px_minmax(90px,.6fr)] min-[641px]:gap-3 min-[641px]:px-2.5 min-[641px]:py-[13px]"
              key={transaction.id}
            >
              {transaction.loan?.customer ? (
                <Avatar name={transaction.loan.customer.name} />
              ) : (
                <span className="avatar inline-grid size-9 shrink-0 place-items-center rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-700">
                  <Landmark size={19} />
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <strong className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">
                  {transaction.description}
                </strong>
                <span className="cash-source mt-[3px] hidden text-[10.5px] text-[#9995a1] min-[641px]:block">
                  {transaction.loan?.customer.name || "Movimentação manual"}
                </span>
                <span className="cash-mobile-date mt-[3px] block text-[10.5px] text-[#9995a1] min-[641px]:hidden">
                  {date(transaction.createdAt)}
                </span>
              </div>
              <time className="mt-[3px] hidden text-[10.5px] not-italic text-[#9995a1] min-[641px]:block">
                {date(transaction.createdAt)}
              </time>
              <span
                className={`transaction-type hidden w-max rounded-full px-2 py-1 text-[10px] font-bold min-[641px]:block ${transaction.type === "INCOME" ? "income bg-emerald-50 text-emerald-700" : "expense bg-rose-50 text-rose-700"}`}
              >
                {transaction.type === "INCOME" ? "Entrada" : "Saída"}
              </span>
              <strong
                className={`min-w-0 justify-self-end whitespace-nowrap text-[clamp(11px,3.6vw,13px)] ${transaction.type === "INCOME" ? "income-text text-emerald-600" : "expense-text text-rose-500"}`}
              >
                {transaction.type === "INCOME" ? "+" : "−"}{" "}
                {money(transaction.amount)}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="Movimentar o caixa"
        description="Registre dinheiro colocado ou retirado para outras necessidades."
        size="sm"
      >
        <form
          className={`${formGridClass} cash-movement-form`}
          onSubmit={submit}
        >
          <Field label="Tipo" hint="Escolha como o valor afeta o saldo.">
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as "INCOME" | "EXPENSE")
              }
            >
              <option value="EXPENSE">Retirada do caixa</option>
              <option value="INCOME">Entrada no caixa</option>
            </Select>
          </Field>
          <Field label="Valor">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              required
            />
          </Field>
          <Field label="Data">
            <Input
              type="date"
              max={todayInput()}
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              required
            />
          </Field>
          <div className={fieldSpanClass}>
            <Field
              label="Descrição"
              hint="Ex.: despesa pessoal, aporte ou material"
            >
              <Textarea
                maxLength={160}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explique para que o dinheiro foi usado"
                required
              />
            </Field>
          </div>
          {formError ? (
            <p
              className={`${fieldSpanClass} form-error m-0 rounded-lg border border-rose-200 bg-rose-50 px-[11px] py-[9px] text-[11px] leading-relaxed text-rose-700`}
            >
              {formError}
            </p>
          ) : null}
          <div className={`${fieldSpanClass} ${formActionsClass}`}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {type === "EXPENSE" ? "Registrar retirada" : "Adicionar entrada"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
