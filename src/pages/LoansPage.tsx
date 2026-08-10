import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, FileText, Filter, Pencil, Phone, Plus, Search } from "lucide-react";
import { api, queryString } from "../lib/api";
import { date, money, todayInput } from "../lib/format";
import type { Customer, Loan, LoanStatus, LoanType } from "../types";
import { Avatar, Button, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, Select, StatusBadge } from "../components/UI";

export function LoanFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (loan: Loan) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [type, setType] = useState<LoanType>("WEEKLY");
  const [principal, setPrincipal] = useState("");
  const [installments, setInstallments] = useState("10");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) api<Customer[]>("/customers").then(setCustomers).catch((caught) => setError(caught.message));
  }, [open]);

  const total = useMemo(() => Number(installments || 0) * Number(installmentAmount || 0), [installments, installmentAmount]);
  const monthlyInterest = useMemo(() => Number(principal || 0) * Number(rate || 0) / 100, [principal, rate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    const numeric = (name: string) => Number(data.get(name));
    try {
      const created = await api<Loan>("/loans", {
        method: "POST",
        body: JSON.stringify({
          customerId: data.get("customerId"),
          type,
          principalAmount: numeric("principalAmount"),
          lateFeePerDay: numeric("lateFeePerDay"),
          loanDate: data.get("loanDate"),
          ...(type === "WEEKLY" ? {
            frequency: data.get("frequency"),
            installmentCount: numeric("installmentCount"),
            installmentAmount: numeric("installmentAmount"),
            firstDueDate: data.get("firstDueDate"),
          } : {
            monthlyDueDay: numeric("monthlyDueDay"),
            monthlyInterestRate: numeric("monthlyInterestRate"),
          }),
        }),
      });
      onCreated(created);
      onClose();
      setPrincipal("");
      setInstallmentAmount("");
      setRate("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar o empréstimo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo empréstimo" description="Defina o cliente e as condições do contrato." size="lg">
      {customers.length === 0 && !error ? (
        <EmptyState title="Cadastre um cliente primeiro" description="Um empréstimo precisa estar vinculado a um cliente da carteira." />
      ) : (
        <form onSubmit={submit} className="form-grid loan-form">
          <div className="field-span loan-type-picker">
            <button type="button" className={type === "WEEKLY" ? "selected" : ""} onClick={() => setType("WEEKLY")}><span><CalendarDays size={19} /></span><div><strong>Parcelado</strong><small>Parcelas semanais, quinzenais ou mensais</small></div></button>
            <button type="button" className={type === "MONTHLY_INTEREST" ? "selected" : ""} onClick={() => setType("MONTHLY_INTEREST")}><span><CircleDollarSign size={19} /></span><div><strong>Juros mensal</strong><small>Juros recorrentes com principal em aberto</small></div></button>
          </div>
          <div className="field-span"><Field label="Cliente"><Select name="customerId" required defaultValue=""><option value="" disabled>Selecione um cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</Select></Field></div>
          <Field label="Valor principal"><Input name="principalAmount" type="number" min="0.01" step="0.01" required value={principal} onChange={(event) => setPrincipal(event.target.value)} placeholder="0,00" /></Field>
          <Field label="Data do empréstimo"><Input name="loanDate" type="date" defaultValue={todayInput()} required /></Field>
          <Field label="Multa por dia"><Input name="lateFeePerDay" type="number" min="0" step="0.01" defaultValue="0" required /></Field>
          {type === "WEEKLY" ? <>
            <Field label="Frequência"><Select name="frequency" defaultValue="WEEKLY"><option value="WEEKLY">Semanal</option><option value="BIWEEKLY">Quinzenal</option><option value="MONTHLY">Mensal</option></Select></Field>
            <Field label="Quantidade de parcelas"><Input name="installmentCount" type="number" min="1" required value={installments} onChange={(event) => setInstallments(event.target.value)} /></Field>
            <Field label="Valor da parcela"><Input name="installmentAmount" type="number" min="0.01" step="0.01" required value={installmentAmount} onChange={(event) => setInstallmentAmount(event.target.value)} placeholder="0,00" /></Field>
            <Field label="Primeiro vencimento"><Input name="firstDueDate" type="date" required /></Field>
            <div className="contract-preview field-span"><span>Total contratado</span><strong>{money(total)}</strong><small>{installments || 0} parcelas de {money(installmentAmount)}</small></div>
          </> : <>
            <Field label="Taxa de juros ao mês"><Input name="monthlyInterestRate" type="number" min="0.0001" step="0.0001" required value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Ex.: 8" /></Field>
            <Field label="Dia do vencimento"><Input name="monthlyDueDay" type="number" min="1" max="31" required defaultValue="10" /></Field>
            <div className="contract-preview field-span"><span>Juros mensal estimado</span><strong>{money(monthlyInterest)}</strong><small>Taxa de {Number(rate || 0).toLocaleString("pt-BR")}% sobre {money(principal)}</small></div>
          </>}
          {error ? <div className="form-error field-span">{error}</div> : null}
          <div className="form-actions field-span"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" loading={saving}>Criar empréstimo</Button></div>
        </form>
      )}
    </Modal>
  );
}

export function EditLoanModal({ loan, onClose, onSaved }: { loan: Loan | null; onClose: () => void; onSaved: (updatedLoan: Loan) => void }) {
  const [principalAmount, setPrincipalAmount] = useState("");
  const [principalBalance, setPrincipalBalance] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("0");
  const [frequency, setFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("WEEKLY");
  const [installmentCount, setInstallmentCount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [monthlyDueDay, setMonthlyDueDay] = useState("10");
  const [rateMode, setRateMode] = useState<"percentage" | "fixed">("percentage");
  const [monthlyInterestRate, setMonthlyInterestRate] = useState("");
  const [monthlyInterestAmount, setMonthlyInterestAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loan) return;
    setPrincipalAmount(loan.principalAmount || "");
    setPrincipalBalance(loan.principalBalance || loan.principalAmount || "");
    setLateFeePerDay(loan.lateFeePerDay || "0");
    if (loan.type === "WEEKLY") {
      setFrequency(loan.frequency || "WEEKLY");
      setInstallmentCount(loan.installmentCount?.toString() || "10");
      setInstallmentAmount(loan.installmentAmount?.toString() || "");
      setFirstDueDate(loan.firstDueDate ? loan.firstDueDate.split("T")[0] : "");
    } else {
      setMonthlyDueDay(loan.monthlyDueDay?.toString() || "10");
      if (loan.monthlyInterestAmount && !loan.monthlyInterestRate) {
        setRateMode("fixed");
        setMonthlyInterestAmount(loan.monthlyInterestAmount.toString());
        setMonthlyInterestRate("");
      } else {
        setRateMode("percentage");
        setMonthlyInterestRate(loan.monthlyInterestRate?.toString() || "");
        setMonthlyInterestAmount("");
      }
    }
    setError("");
  }, [loan]);

  if (!loan) return null;

  const paidCount = loan.summary?.paidCount || 0;
  const paidAmountTotal = loan.installments
    ? loan.installments.filter((i) => i.status === "PAID" || Number(i.paidAmount) > 0).reduce((sum, i) => sum + Number(i.paidAmount || i.amount || 0), 0)
    : 0;

  const totalCalculated = isWeekly ? Number(installmentCount || 0) * Number(installmentAmount || 0) : Number(principalBalance || principalAmount || 0);
  const remainingInstallmentsCount = isWeekly ? Math.max(0, Number(installmentCount || 0) - paidCount) : 0;
  const remainingBalanceCalculated = isWeekly ? remainingInstallmentsCount * Number(installmentAmount || 0) : Number(principalBalance || 0);
  const monthlyInterestCalculated = isWeekly ? 0 : (rateMode === "percentage" ? (Number(principalBalance || principalAmount || 0) * Number(monthlyInterestRate || 0)) / 100 : Number(monthlyInterestAmount || 0));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loan) return;
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      principalAmount: Number(principalAmount),
      lateFeePerDay: Number(lateFeePerDay),
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
      const updated = await api<Loan>(`/loans/${loan.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      onSaved(updated);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível editar o empréstimo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(loan)} onClose={onClose} title="Editar empréstimo" description={`Contrato de ${loan.customer.name}`} size="lg">
      <form onSubmit={submit} className="form-grid loan-form">
        {hasPayments ? (
          <div className="field-span form-info-box">
            <strong>Atenção ao renegociar:</strong> Este contrato possui pagamentos registrados ({paidCount} cobrança(s) já paga(s) totalizando {money(paidAmountTotal)}). O histórico pago é mantido e os novos valores serão aplicados às parcelas/cobranças futuras.
          </div>
        ) : null}

        <Field label="Valor Principal Inicial"><Input type="number" min="0.01" step="0.01" required value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} /></Field>
        {isWeekly ? null : (
          <Field label="Saldo Devedor Principal Atual"><Input type="number" min="0" step="0.01" required value={principalBalance} onChange={(e) => setPrincipalBalance(e.target.value)} /></Field>
        )}
        <Field label="Multa por dia de atraso"><Input type="number" min="0" step="0.01" required value={lateFeePerDay} onChange={(e) => setLateFeePerDay(e.target.value)} /></Field>

        {isWeekly ? (
          <>
            <Field label="Frequência"><Select value={frequency} onChange={(e) => setFrequency(e.target.value as "WEEKLY" | "BIWEEKLY" | "MONTHLY")}><option value="WEEKLY">Semanal</option><option value="BIWEEKLY">Quinzenal</option><option value="MONTHLY">Mensal</option></Select></Field>
            <Field label="Quantidade total de parcelas"><Input type="number" min={Math.max(1, paidCount)} required value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} /></Field>
            <Field label="Valor da parcela"><Input type="number" min="0.01" step="0.01" required value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} placeholder="0,00" /></Field>
            <Field label="Primeiro vencimento"><Input type="date" required value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} /></Field>
            <div className="contract-preview field-span">
              <span>Total contratado estimado: <strong>{money(totalCalculated)}</strong> ({installmentCount || 0} parcelas de {money(installmentAmount)})</span>
              <small style={{ marginTop: 4, display: "block" }}>
                Saldo a pagar restante: <strong>{money(remainingBalanceCalculated)}</strong> ({remainingInstallmentsCount} parcelas futuras de {money(installmentAmount)})
              </small>
            </div>
          </>
        ) : (
          <>
            <Field label="Dia do vencimento mensal"><Input type="number" min="1" max="31" required value={monthlyDueDay} onChange={(e) => setMonthlyDueDay(e.target.value)} /></Field>
            <div className="field-span loan-type-picker">
              <button type="button" className={rateMode === "percentage" ? "selected" : ""} onClick={() => setRateMode("percentage")}><div><strong>Taxa percentual (%)</strong></div></button>
              <button type="button" className={rateMode === "fixed" ? "selected" : ""} onClick={() => setRateMode("fixed")}><div><strong>Valor fixo de juros (R$)</strong></div></button>
            </div>
            {rateMode === "percentage" ? (
              <Field label="Taxa de juros ao mês (%)"><Input type="number" min="0.0001" step="0.0001" required value={monthlyInterestRate} onChange={(e) => setMonthlyInterestRate(e.target.value)} placeholder="Ex.: 10" /></Field>
            ) : (
              <Field label="Valor mensal de juros (R$)"><Input type="number" min="0.01" step="0.01" required value={monthlyInterestAmount} onChange={(e) => setMonthlyInterestAmount(e.target.value)} placeholder="Ex.: 1000,00" /></Field>
            )}
            <div className="contract-preview field-span"><span>Juros mensal estimado</span><strong>{money(monthlyInterestCalculated)}</strong><small>{rateMode === "percentage" ? `Taxa de ${Number(monthlyInterestRate || 0).toLocaleString("pt-BR")}% sobre o saldo de ${money(principalBalance || principalAmount)}` : `Juros fixos de ${money(monthlyInterestAmount)}`}</small></div>
          </>
        )}

        {error ? <div className="form-error field-span">{error}</div> : null}
        <div className="form-actions field-span"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" loading={saving}>Salvar alterações</Button></div>
      </form>
    </Modal>
  );
}

export function LoansPage({ refreshKey, onNewLoan, onPayment, onReport, onSaved }: { refreshKey: number; onNewLoan: () => void; onPayment: (loan: Loan) => void; onReport: (loan: Loan) => void; onSaved?: (message: string) => void }) {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [type, setType] = useState<LoanType | "">("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Loan[]>(`/loans${queryString({ status, type })}`).then((result) => { setLoans(result); setError(""); }).catch((caught) => setError(caught.message));
  }, [status, type]);

  useEffect(load, [load, refreshKey]);

  const filtered = useMemo(() => loans?.filter((loan) => loan.customer.name.toLowerCase().includes(search.toLowerCase())) || [], [loans, search]);

  return (
    <div className="page-enter data-page loans-page">
      <PageHeader eyebrow="Carteira" title="Empréstimos" description="Acompanhe contratos, saldos e andamento dos pagamentos." action={<Button onClick={onNewLoan}><Plus size={18} /> Novo empréstimo</Button>} />
      <section className="panel table-panel">
        <div className="list-toolbar loan-toolbar">
          <div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente" /></div>
          <div className="toolbar-filters"><Filter size={16} /><Select value={status} onChange={(event) => setStatus(event.target.value as LoanStatus | "")}><option value="">Todos os status</option><option value="ACTIVE">Em dia</option><option value="OVERDUE">Em atraso</option><option value="PAID">Pagos</option><option value="RENEWED">Renovados</option><option value="CANCELLED">Cancelados</option></Select><Select value={type} onChange={(event) => setType(event.target.value as LoanType | "")}><option value="">Todos os tipos</option><option value="WEEKLY">Parcelado</option><option value="MONTHLY_INTEREST">Juros mensal</option></Select></div>
        </div>
        {!loans && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loans && filtered.length === 0 ? <EmptyState title="Nenhum empréstimo por aqui" description="Crie um novo contrato ou ajuste os filtros da lista." action={!loans.length ? <Button onClick={onNewLoan}><Plus size={17} /> Criar empréstimo</Button> : undefined} /> : null}
        <div className="loan-list">
          {filtered.map((loan) => {
            const progress = loan.summary.totalCount ? loan.summary.paidCount / loan.summary.totalCount * 100 : (Number(loan.principalAmount) - Number(loan.principalBalance)) / Number(loan.principalAmount) * 100;
            const charges = loan.type === "WEEKLY" ? loan.installments : loan.monthlyCharges;
            const isOpen = expanded === loan.id;
            return (
              <article className={`loan-card ${isOpen ? "expanded" : ""}`} key={loan.id}>
                <button className="loan-main" onClick={() => setExpanded(isOpen ? null : loan.id)}>
                  <Avatar name={loan.customer.name} />
                  <div className="loan-person"><strong>{loan.customer.name}</strong><span><Phone size={13} /> {loan.customer.phone}</span></div>
                  <div className="loan-type"><span>{loan.type === "WEEKLY" ? "Parcelado" : "Juros mensal"}</span><small>Início em {date(loan.loanDate)}</small></div>
                  <div className="loan-amount"><strong>{money(loan.summary.openBalance)}</strong><span>valor a pagar</span></div>
                  <div className="loan-status"><StatusBadge status={loan.status} />{loan.summary.nextDue ? <small>Próx. {date(loan.summary.nextDue)}</small> : null}</div>
                  {isOpen ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
                </button>
                <div className="loan-progress"><span style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }} /></div>
                {isOpen ? (
                  <div className="loan-detail">
                    <div className="loan-detail-stats"><div><span>Valor principal</span><strong>{money(loan.principalAmount)}</strong></div><div><span>Total recebido</span><strong>{money(loan.summary.received)}</strong></div><div><span>Multas acumuladas</span><strong>{money(loan.summary.lateFees)}</strong></div><div><span>Andamento</span><strong>{loan.summary.paidCount}/{loan.summary.totalCount} cobranças</strong></div></div>
                    <div className="schedule-head">
                      <strong>Agenda do contrato</strong>
                      <div className="loan-detail-actions">
                        <Button variant="secondary" onClick={() => onReport(loan)}><FileText size={17} /> Relatório</Button>
                        {["ACTIVE", "OVERDUE"].includes(loan.status) ? <Button variant="secondary" onClick={() => setEditingLoan(loan)}><Pencil size={17} /> Editar contrato</Button> : null}
                        {["ACTIVE", "OVERDUE"].includes(loan.status) ? <Button onClick={() => onPayment(loan)}><CircleDollarSign size={17} /> Registrar pagamento</Button> : null}
                      </div>
                    </div>
                    <div className="schedule-grid">
                      {charges.slice(0, 12).map((charge) => <div className="schedule-item" key={charge.id}><span>{charge.number ? `#${charge.number}` : charge.referenceMonth}</span><div><strong>{money(charge.amount || charge.interestAmount)}</strong><small>{date(charge.dueDate)}</small></div><StatusBadge status={charge.status} /></div>)}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <EditLoanModal loan={editingLoan} onClose={() => setEditingLoan(null)} onSaved={() => { load(); onSaved?.("Empréstimo atualizado com sucesso."); }} />
    </div>
  );
}

