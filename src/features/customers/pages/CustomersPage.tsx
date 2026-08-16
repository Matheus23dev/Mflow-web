import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronRight, FileText, IdCard, MapPin, Pencil, Phone, Plus, Search } from "lucide-react";
import { date, money } from "@/shared/lib/format";
import type { Customer, CustomerDetails, Loan } from "@/shared/types";
import { Avatar, Button, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, StatusBadge, Textarea } from "@/shared/ui";
import { useCustomers } from "../hooks/useCustomers";
import { customersService } from "../services/customers.service";
import { CustomerSummaryStrip } from "../components/CustomerSummaryStrip";

type EditableCustomer = Pick<Customer, "id" | "name" | "phone" | "cpf" | "address" | "notes">;

const formGridClass = "form-grid grid grid-cols-1 gap-[15px] min-[641px]:grid-cols-2 [&>*]:min-w-0";
const fieldSpanClass = "field-span min-[641px]:col-span-2";
const formActionsClass = "form-actions -mx-[17px] -mb-[18px] mt-[3px] flex flex-col-reverse justify-end gap-2 border-t border-[#ebe8ee] bg-[#fbfafd] px-[17px] py-[13px] min-[421px]:flex-row min-[641px]:-mx-[22px] min-[641px]:-mb-[22px] min-[641px]:mt-1 min-[641px]:px-[22px] min-[641px]:py-[14px] max-[420px]:[&>[data-ui=button]]:w-full";
const panelClass = "panel table-panel min-w-0 overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:flex-col";

function customerPayload(data: FormData) {
  const value = (field: string) => String(data.get(field) || "").trim();
  return {
    name: value("name"),
    phone: value("phone"),
    cpf: value("cpf") || null,
    address: value("address") || null,
    notes: value("notes") || null,
  };
}

function CustomerDetailModal({ customerId, onClose, onReport, onEdit }: { customerId: string | null; onClose: () => void; onReport: (loan: Loan) => void; onEdit: (customer: CustomerDetails) => void }) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    customersService.find(customerId)
      .then((result) => { setCustomer(result); setError(""); })
      .catch((caught) => setError(caught.message));
  }, [customerId]);

  async function openReport(loanId: string) {
    setReportLoading(loanId);
    setError("");
    try {
      const loan = await customersService.loanReport(loanId);
      onClose();
      onReport(loan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível abrir o relatório.");
    } finally {
      setReportLoading(null);
    }
  }

  return (
    <Modal open={Boolean(customerId)} onClose={onClose} title="Dados do cliente" description="Cadastro, indicadores e histórico de contratos." size="lg">
      {!customer && !error ? <LoadingState label="Carregando histórico" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {customer ? <div className="customer-detail flex flex-col gap-[17px]">
        <div className="customer-profile-card flex flex-wrap items-start gap-[14px] rounded-xl border border-[#e4def4] bg-gradient-to-br from-[#fbf9ff] to-[#f4f0ff] p-4 min-[641px]:flex-nowrap min-[641px]:items-center">
          <Avatar name={customer.name} size="lg" />
          <div className="customer-profile-main flex min-w-0 flex-1 flex-col">
            <strong className="overflow-hidden text-[17px] text-[#302b3a] text-ellipsis whitespace-nowrap">{customer.name}</strong>
            <div className="customer-profile-meta mt-[7px] flex flex-wrap gap-x-[18px] gap-y-2">
              <span className="flex items-center gap-1.5 text-xs text-[#686171] [&>svg]:shrink-0 [&>svg]:text-violet-600"><Phone size={15} /> {customer.phone}</span>
              <span className="flex items-center gap-1.5 text-xs text-[#686171] [&>svg]:shrink-0 [&>svg]:text-violet-600"><IdCard size={15} /> {customer.cpf || "CPF não informado"}</span>
            </div>
            <span className="customer-profile-address mt-[7px] flex items-center gap-1.5 text-xs text-[#817a89] [&>svg]:shrink-0 [&>svg]:text-violet-600"><MapPin size={15} /> {customer.address || "Endereço não informado"}</span>
          </div>
          <Button className="customer-profile-edit w-full shrink-0 min-[641px]:w-auto" variant="secondary" onClick={() => onEdit(customer)}><Pencil size={16} /> Editar</Button>
        </div>
        <div className="customer-detail-stats grid grid-cols-2 gap-2 min-[641px]:grid-cols-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e9e6ee] [&>div]:bg-white [&>div]:p-[14px] [&_span]:text-[10.5px] [&_span]:text-[#96919e] [&_strong]:mt-[5px] [&_strong]:overflow-hidden [&_strong]:text-[15px] [&_strong]:text-ellipsis">
          <div><span>Total emprestado</span><strong>{money(customer.stats.totalLent)}</strong></div>
          <div><span>Total recebido</span><strong>{money(customer.stats.totalReceived)}</strong></div>
          <div><span>Valor a pagar</span><strong>{money(customer.stats.totalOpen)}</strong></div>
          <div><span>Pendências</span><strong>{customer.stats.overdueCount}</strong></div>
        </div>
        <div className="customer-detail-section overflow-hidden rounded-[10px] border border-[#e9e6ee]">
          <div className="section-title flex items-center justify-between bg-[#f8f7fa] px-[13px] py-[11px]"><strong className="text-[13px]">Contratos</strong><span className="text-[10.5px] text-[#9a96a1]">{customer.stats.loanCount} no histórico</span></div>
          {customer.loans.length ? customer.loans.slice(0, 8).map((loan) => {
            const openBalance = loan.type === "WEEKLY"
              ? loan.installments.reduce((sum, item) => sum + Number(item.amount || 0) - Number(item.paidAmount), 0)
              : Number(loan.principalBalance) + loan.monthlyCharges.reduce((sum, item) => sum + Number(item.interestAmount || 0) - Number(item.paidAmount), 0);
            return <div className="detail-loan-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-[#efedf2] px-[13px] py-3 min-[641px]:grid-cols-[minmax(150px,1fr)_minmax(90px,.5fr)_auto_auto] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div>strong]:text-[13px] [&>div>span]:mt-[3px] [&>div>span]:text-[10.5px] [&>div>span]:text-[#9995a1]" key={loan.id}>
              <div><strong>{loan.type === "WEEKLY" ? "Contrato parcelado" : "Juros mensal"}</strong><span>Iniciado em {date(loan.loanDate)}</span></div>
              <div><strong>{money(openBalance)}</strong><span>a pagar</span></div>
              <span className="max-[640px]:hidden"><StatusBadge status={loan.status} /></span>
              <Button className="col-span-2 w-full min-[641px]:col-span-1 min-[641px]:min-h-[38px] min-[641px]:w-auto min-[641px]:px-[11px] min-[641px]:py-2" variant="secondary" loading={reportLoading === loan.id} onClick={() => openReport(loan.id)}><FileText size={16} /> Relatório</Button>
            </div>;
          }) : <p className="detail-empty m-0 p-5 text-center text-[11px] text-[#9995a1]">Nenhum contrato registrado.</p>}
        </div>
        {customer.notes ? <div className="customer-notes flex flex-col gap-[5px] rounded-[9px] bg-[#f7f5fb] px-[14px] py-3"><strong className="text-[11px]">Observações</strong><p className="m-0 text-[11px] leading-6 text-[#837e8b]">{customer.notes}</p></div> : null}
      </div> : null}
    </Modal>
  );
}

export function CustomersPage({ refreshKey, onCreated, onReport, externalSearch = "" }: { refreshKey: number; onCreated: (message: string) => void; onReport: (loan: Loan) => void; externalSearch?: string }) {
  const [search, setSearch] = useState(externalSearch);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<EditableCustomer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { customers, error, reload: load } = useCustomers(debouncedSearch, refreshKey);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await customersService.create(customerPayload(data));
      setModalOpen(false);
      onCreated("Cliente adicionado com sucesso.");
      load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await customersService.update(editingCustomer.id, customerPayload(data));
      setEditingCustomer(null);
      onCreated("Dados do cliente atualizados.");
      load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Não foi possível atualizar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  const totals = useMemo(() => ({
    customers: customers?.length || 0,
    active: customers?.filter((customer) => customer.loans?.length).length || 0,
    loans: customers?.reduce((sum, customer) => sum + (customer._count?.loans || 0), 0) || 0,
  }), [customers]);

  return (
    <div className="page-enter data-page customers-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader eyebrow="Relacionamento" title="Clientes" description="Todas as pessoas da sua carteira em um só lugar." action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Novo cliente</Button>} />

      <CustomerSummaryStrip customers={totals.customers} active={totals.active} loans={totals.loans} />

      <section className={panelClass}>
        <div className="list-toolbar flex min-h-[68px] flex-col items-stretch justify-between gap-[14px] border-b border-[#eeecf1] px-[18px] py-[14px] min-[641px]:flex-row min-[641px]:items-center">
          <div className="search-box flex h-[43px] w-full items-center gap-[9px] rounded-[9px] border border-[#e6e3ea] bg-[#faf9fc] px-[11px] text-[#9b97a3] focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100 min-[641px]:w-[min(360px,100%)]"><Search className="shrink-0" size={18} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#373340] outline-none placeholder:text-[#aaa6b1] min-[641px]:text-[13px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou CPF" /></div>
          <span className="text-[11px] text-[#9b97a2]">{customers?.length || 0} resultados</span>
        </div>
        {!customers && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {customers?.length === 0 ? <EmptyState title={search ? "Nenhum cliente encontrado" : "Sua carteira começa aqui"} description={search ? "Tente buscar por outro nome, telefone ou CPF." : "Cadastre o primeiro cliente para criar um empréstimo."} action={!search ? <Button onClick={() => setModalOpen(true)}><Plus size={17} /> Adicionar cliente</Button> : undefined} /> : null}
        {customers?.length ? (
          <div className="customer-table px-1.5 pb-[7px] min-[641px]:px-3 min-[641px]:pb-2.5 min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain">
            <div className="table-head hidden items-center gap-[13px] px-[13px] pb-[9px] pt-3 text-[10px] font-bold uppercase tracking-[.45px] text-[#aaa6b1] min-[641px]:grid min-[641px]:grid-cols-[minmax(175px,1.2fr)_.55fr_.7fr_18px] min-[641px]:[&>span:nth-child(2)]:hidden min-[861px]:grid-cols-[minmax(180px,1.1fr)_minmax(150px,1fr)_.5fr_.65fr_18px] min-[861px]:[&>span:nth-child(2)]:block min-[1121px]:grid-cols-[minmax(190px,1.25fr)_minmax(175px,1fr)_.55fr_.7fr_22px]"><span>Cliente</span><span>Contato</span><span>Contratos</span><span>Valor a pagar</span><span /></div>
            {customers.map((customer) => {
              const activeBalance = customer.loans?.reduce((sum, loan) => sum + Number(loan.openBalance || 0), 0) || 0;
              return (
                <button className="customer-row grid w-full grid-cols-[minmax(0,1fr)_minmax(78px,auto)_16px] items-center gap-2 overflow-hidden border-0 border-t border-[#f0eef3] bg-transparent px-2 py-2.5 text-left text-[#393541] transition hover:rounded-[9px] hover:bg-[#faf9fc] min-[641px]:grid-cols-[minmax(175px,1.2fr)_.55fr_.7fr_18px] min-[641px]:gap-[13px] min-[641px]:px-[13px] min-[641px]:py-2 min-[861px]:grid-cols-[minmax(180px,1.1fr)_minmax(150px,1fr)_.5fr_.65fr_18px] min-[1121px]:grid-cols-[minmax(190px,1.25fr)_minmax(175px,1fr)_.55fr_.7fr_22px]" key={customer.id} onClick={() => setSelectedCustomer(customer.id)}>
                  <div className="customer-name flex min-w-0 flex-row items-center gap-2.5"><Avatar name={customer.name} /><p className="m-0 flex min-w-0 flex-1 flex-col"><strong className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">{customer.name}</strong><span className="mt-[3px] overflow-hidden text-[10.5px] text-[#9b97a3] text-ellipsis whitespace-nowrap">{customer.cpf || "CPF não informado"}</span></p></div>
                  <div className="customer-contact hidden min-w-0 flex-col min-[861px]:flex"><span className="flex items-center gap-[5px] text-xs"><Phone className="shrink-0" size={14} /> {customer.phone}</span><small className="mt-[3px] flex items-center gap-1 overflow-hidden text-[10.5px] text-[#9b97a3] text-ellipsis whitespace-nowrap"><MapPin className="shrink-0" size={13} /> {customer.address || "Endereço não informado"}</small></div>
                  <div className="customer-loan-count hidden min-w-0 flex-col min-[641px]:flex"><strong className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">{customer._count?.loans || 0}</strong><small className="mt-[3px] overflow-hidden text-[10.5px] text-[#9b97a3] text-ellipsis whitespace-nowrap">{customer.loans?.length || 0} ativos</small></div>
                  <div className="customer-open-balance flex min-w-0 flex-col items-end text-right min-[641px]:items-start min-[641px]:text-left"><strong className={`overflow-hidden text-[13px] text-ellipsis whitespace-nowrap ${activeBalance ? "purple-text text-violet-700" : ""}`}>{money(activeBalance)}</strong><small className="mt-[3px] overflow-hidden text-[10.5px] text-[#9b97a3] text-ellipsis whitespace-nowrap">principal</small></div>
                  <ChevronRight size={18} className="muted text-[#aaa6b1]" />
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo cliente" description="Cadastre os dados principais para começar." size="md">
        <form onSubmit={createCustomer} className={formGridClass}>
          <Field label="Nome completo"><Input name="name" required minLength={2} placeholder="Ex.: Mariana Alves" autoFocus /></Field>
          <Field label="Telefone"><Input name="phone" type="tel" inputMode="tel" required minLength={8} placeholder="(11) 99999-9999" /></Field>
          <Field label="CPF" hint="Opcional"><Input name="cpf" inputMode="numeric" placeholder="000.000.000-00" /></Field>
          <Field label="Endereço" hint="Opcional"><Input name="address" placeholder="Rua, número e bairro" /></Field>
          <div className={fieldSpanClass}><Field label="Observações" hint="Opcional"><Textarea name="notes" rows={3} placeholder="Informações úteis sobre o cliente" /></Field></div>
          {formError ? <div className={`${fieldSpanClass} form-error rounded-lg border border-rose-200 bg-rose-50 px-[11px] py-[9px] text-[11px] leading-relaxed text-rose-700`}>{formError}</div> : null}
          <div className={`${fieldSpanClass} ${formActionsClass}`}><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit" loading={saving}>Salvar cliente</Button></div>
        </form>
      </Modal>
      <Modal open={Boolean(editingCustomer)} onClose={() => !saving && setEditingCustomer(null)} title="Editar cliente" description="Atualize os dados de cadastro quando precisar." size="md">
        {editingCustomer ? <form key={editingCustomer.id} onSubmit={updateCustomer} className={formGridClass}>
          <Field label="Nome completo"><Input name="name" required minLength={2} defaultValue={editingCustomer.name} autoFocus /></Field>
          <Field label="Telefone"><Input name="phone" type="tel" inputMode="tel" required minLength={8} defaultValue={editingCustomer.phone} /></Field>
          <Field label="CPF" hint="Opcional"><Input name="cpf" inputMode="numeric" defaultValue={editingCustomer.cpf || ""} placeholder="000.000.000-00" /></Field>
          <Field label="Endereço" hint="Opcional"><Input name="address" defaultValue={editingCustomer.address || ""} placeholder="Rua, número e bairro" /></Field>
          <div className={fieldSpanClass}><Field label="Observações" hint="Opcional"><Textarea name="notes" rows={3} defaultValue={editingCustomer.notes || ""} placeholder="Informações úteis sobre o cliente" /></Field></div>
          {formError ? <div className={`${fieldSpanClass} form-error rounded-lg border border-rose-200 bg-rose-50 px-[11px] py-[9px] text-[11px] leading-relaxed text-rose-700`}>{formError}</div> : null}
          <div className={`${fieldSpanClass} ${formActionsClass}`}><Button type="button" variant="ghost" onClick={() => setEditingCustomer(null)}>Cancelar</Button><Button type="submit" loading={saving}>Salvar alterações</Button></div>
        </form> : null}
      </Modal>
      <CustomerDetailModal key={selectedCustomer || "closed"} customerId={selectedCustomer} onClose={() => setSelectedCustomer(null)} onReport={onReport} onEdit={(customer) => { setSelectedCustomer(null); setEditingCustomer(customer); setFormError(""); }} />
    </div>
  );
}
