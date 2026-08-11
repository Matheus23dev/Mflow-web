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

export function CashPage({ refreshKey, onSaved }: { refreshKey: number; onSaved: (message: string) => void }) {
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

  const { data, error: pageError, reload: load } = useCash(from, to, refreshKey);

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
      await cashService.create({ type, amount: Number(amount), description, transactionDate });
      setModalOpen(false);
      setAmount("");
      setDescription("");
      setTransactionDate(todayInput());
      onSaved(type === "INCOME" ? "Entrada adicionada ao caixa." : "Retirada registrada no caixa.");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Não foi possível salvar a movimentação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-enter data-page cash-page">
      <PageHeader
        eyebrow="Movimentação"
        title="Fluxo de caixa"
        description="Acompanhe entradas, retiradas e movimentações dos contratos."
        action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Nova movimentação</Button>}
      />

      <div className="cash-metrics">
        <CashMetricCard tone="purple" icon={<Wallet size={22} />} label="Saldo do período" value={money(data?.summary.balance)} />
        <CashMetricCard tone="green" icon={<ArrowDownLeft size={22} />} label="Entradas" value={money(data?.summary.income)} />
        <CashMetricCard tone="red" icon={<ArrowUpRight size={22} />} label="Saídas" value={money(data?.summary.expense)} />
      </div>

      <section className="panel table-panel">
        <div className="list-toolbar cash-toolbar">
          <div className="search-box"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição ou cliente" /></div>
          <div className="date-range"><CalendarRange size={18} /><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Data inicial" /><span>até</span><Input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} aria-label="Data final" /></div>
        </div>
        {!data && !pageError ? <LoadingState /> : null}
        {pageError ? <ErrorState message={pageError} onRetry={load} /> : null}
        {data && transactions.length === 0 ? <EmptyState title="Sem movimentações no período" description="Adicione uma entrada ou retirada, ou registre um contrato ou pagamento." action={<Button onClick={() => setModalOpen(true)}>Adicionar movimentação</Button>} /> : null}
        <div className="cash-list">
          {transactions.map((transaction) => (
            <article className="cash-row" key={transaction.id}>
              {transaction.loan?.customer ? <Avatar name={transaction.loan.customer.name} /> : <span className="avatar"><Landmark size={19} /></span>}
              <div>
                <strong>{transaction.description}</strong>
                <span className="cash-source">{transaction.loan?.customer.name || "Movimentação manual"}</span>
                <span className="cash-mobile-date">{date(transaction.createdAt)}</span>
              </div>
              <time>{date(transaction.createdAt)}</time>
              <span className={`transaction-type ${transaction.type.toLowerCase()}`}>{transaction.type === "INCOME" ? "Entrada" : "Saída"}</span>
              <strong className={transaction.type === "INCOME" ? "income-text" : "expense-text"}>{transaction.type === "INCOME" ? "+" : "−"} {money(transaction.amount)}</strong>
            </article>
          ))}
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Movimentar o caixa" description="Registre dinheiro colocado ou retirado para outras necessidades." size="sm">
        <form className="form-grid cash-movement-form" onSubmit={submit}>
          <Field label="Tipo" hint="Escolha como o valor afeta o saldo.">
            <Select value={type} onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}>
              <option value="EXPENSE">Retirada do caixa</option>
              <option value="INCOME">Entrada no caixa</option>
            </Select>
          </Field>
          <Field label="Valor">
            <Input type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" required />
          </Field>
          <Field label="Data">
            <Input type="date" max={todayInput()} value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required />
          </Field>
          <Field label="Descrição" hint="Ex.: despesa pessoal, aporte ou material" >
            <Textarea maxLength={160} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique para que o dinheiro foi usado" required />
          </Field>
          {formError ? <p className="form-error field-span">{formError}</p> : null}
          <div className="form-actions field-span">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{type === "EXPENSE" ? "Registrar retirada" : "Adicionar entrada"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
