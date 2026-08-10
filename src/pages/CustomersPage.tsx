import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronRight, FileText, IdCard, MapPin, Pencil, Phone, Plus, Search, UsersRound } from "lucide-react";
import { api, queryString } from "../lib/api";
import { date, money } from "../lib/format";
import type { Customer, CustomerDetails, Loan } from "../types";
import { Avatar, Button, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, StatusBadge, Textarea } from "../components/UI";

type EditableCustomer = Pick<Customer, "id" | "name" | "phone" | "cpf" | "address" | "notes">;

function CustomerDetailModal({ customerId, onClose, onReport, onEdit }: { customerId: string | null; onClose: () => void; onReport: (loan: Loan) => void; onEdit: (customer: CustomerDetails) => void }) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    api<CustomerDetails>(`/customers/${customerId}`)
      .then((result) => { setCustomer(result); setError(""); })
      .catch((caught) => setError(caught.message));
  }, [customerId]);

  async function openReport(loanId: string) {
    setReportLoading(loanId);
    setError("");
    try {
      const loan = await api<Loan>(`/loans/${loanId}`);
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
      {customer ? <div className="customer-detail">
        <div className="customer-profile-card">
          <Avatar name={customer.name} size="lg" />
          <div className="customer-profile-main">
            <strong>{customer.name}</strong>
            <div className="customer-profile-meta">
              <span><Phone size={15} /> {customer.phone}</span>
              <span><IdCard size={15} /> {customer.cpf || "CPF não informado"}</span>
            </div>
            <span className="customer-profile-address"><MapPin size={15} /> {customer.address || "Endereço não informado"}</span>
          </div>
          <Button className="customer-profile-edit" variant="secondary" onClick={() => onEdit(customer)}><Pencil size={16} /> Editar</Button>
        </div>
        <div className="customer-detail-stats">
          <div><span>Total emprestado</span><strong>{money(customer.stats.totalLent)}</strong></div>
          <div><span>Total recebido</span><strong>{money(customer.stats.totalReceived)}</strong></div>
          <div><span>Valor a pagar</span><strong>{money(customer.stats.totalOpen)}</strong></div>
          <div><span>Pendências</span><strong>{customer.stats.overdueCount}</strong></div>
        </div>
        <div className="customer-detail-section">
          <div className="section-title"><strong>Contratos</strong><span>{customer.stats.loanCount} no histórico</span></div>
          {customer.loans.length ? customer.loans.slice(0, 8).map((loan) => {
            const openBalance = loan.type === "WEEKLY"
              ? loan.installments.reduce((sum, item) => sum + Number(item.amount || 0) - Number(item.paidAmount), 0)
              : Number(loan.principalBalance) + loan.monthlyCharges.reduce((sum, item) => sum + Number(item.interestAmount || 0) - Number(item.paidAmount), 0);
            return <div className="detail-loan-row" key={loan.id}>
              <div><strong>{loan.type === "WEEKLY" ? "Contrato parcelado" : "Juros mensal"}</strong><span>Iniciado em {date(loan.loanDate)}</span></div>
              <div><strong>{money(openBalance)}</strong><span>a pagar</span></div>
              <StatusBadge status={loan.status} />
              <Button variant="secondary" loading={reportLoading === loan.id} onClick={() => openReport(loan.id)}><FileText size={16} /> Relatório</Button>
            </div>;
          }) : <p className="detail-empty">Nenhum contrato registrado.</p>}
        </div>
        {customer.notes ? <div className="customer-notes"><strong>Observações</strong><p>{customer.notes}</p></div> : null}
      </div> : null}
    </Modal>
  );
}

export function CustomersPage({ refreshKey, onCreated, onReport, externalSearch = "" }: { refreshKey: number; onCreated: (message: string) => void; onReport: (loan: Loan) => void; externalSearch?: string }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState(externalSearch);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<EditableCustomer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    api<Customer[]>(`/customers${queryString({ search: debouncedSearch })}`)
      .then((result) => { setCustomers(result); setError(""); })
      .catch((caught) => setError(caught.message));
  }, [debouncedSearch]);

  useEffect(load, [load, refreshKey]);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), cpf: data.get("cpf"), address: data.get("address"), notes: data.get("notes") }),
      });
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
      await api<Customer>(`/customers/${editingCustomer.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), cpf: data.get("cpf"), address: data.get("address"), notes: data.get("notes") }),
      });
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
    <div className="page-enter data-page customers-page">
      <PageHeader eyebrow="Relacionamento" title="Clientes" description="Todas as pessoas da sua carteira em um só lugar." action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Novo cliente</Button>} />

      <div className="summary-strip">
        <div><span className="summary-icon"><UsersRound size={19} /></span><p><strong>{totals.customers}</strong><span>clientes cadastrados</span></p></div>
        <div><p><strong>{totals.active}</strong><span>com contratos ativos</span></p></div>
        <div><p><strong>{totals.loans}</strong><span>contratos no histórico</span></p></div>
      </div>

      <section className="panel table-panel">
        <div className="list-toolbar">
          <div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou CPF" /></div>
          <span>{customers?.length || 0} resultados</span>
        </div>
        {!customers && !error ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {customers?.length === 0 ? <EmptyState title={search ? "Nenhum cliente encontrado" : "Sua carteira começa aqui"} description={search ? "Tente buscar por outro nome, telefone ou CPF." : "Cadastre o primeiro cliente para criar um empréstimo."} action={!search ? <Button onClick={() => setModalOpen(true)}><Plus size={17} /> Adicionar cliente</Button> : undefined} /> : null}
        {customers?.length ? (
          <div className="customer-table">
            <div className="table-head"><span>Cliente</span><span>Contato</span><span>Contratos</span><span>Valor a pagar</span><span /></div>
            {customers.map((customer) => {
              const activeBalance = customer.loans?.reduce((sum, loan) => sum + Number(loan.openBalance || 0), 0) || 0;
              return (
                <button className="customer-row" key={customer.id} onClick={() => setSelectedCustomer(customer.id)}>
                  <div className="customer-name"><Avatar name={customer.name} /><p><strong>{customer.name}</strong><span>{customer.cpf || "CPF não informado"}</span></p></div>
                  <div className="customer-contact"><span><Phone size={14} /> {customer.phone}</span><small><MapPin size={13} /> {customer.address || "Endereço não informado"}</small></div>
                  <div><strong>{customer._count?.loans || 0}</strong><small>{customer.loans?.length || 0} ativos</small></div>
                  <div><strong className={activeBalance ? "purple-text" : ""}>{money(activeBalance)}</strong><small>principal</small></div>
                  <ChevronRight size={18} className="muted" />
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo cliente" description="Cadastre os dados principais para começar." size="md">
        <form onSubmit={createCustomer} className="form-grid">
          <Field label="Nome completo"><Input name="name" required minLength={2} placeholder="Ex.: Mariana Alves" autoFocus /></Field>
          <Field label="Telefone"><Input name="phone" required minLength={8} placeholder="(11) 99999-9999" /></Field>
          <Field label="CPF" hint="Opcional"><Input name="cpf" placeholder="000.000.000-00" /></Field>
          <Field label="Endereço" hint="Opcional"><Input name="address" placeholder="Rua, número e bairro" /></Field>
          <div className="field-span"><Field label="Observações" hint="Opcional"><Textarea name="notes" rows={3} placeholder="Informações úteis sobre o cliente" /></Field></div>
          {formError ? <div className="form-error field-span">{formError}</div> : null}
          <div className="form-actions field-span"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit" loading={saving}>Salvar cliente</Button></div>
        </form>
      </Modal>
      <Modal open={Boolean(editingCustomer)} onClose={() => !saving && setEditingCustomer(null)} title="Editar cliente" description="Atualize os dados de cadastro quando precisar." size="md">
        {editingCustomer ? <form key={editingCustomer.id} onSubmit={updateCustomer} className="form-grid">
          <Field label="Nome completo"><Input name="name" required minLength={2} defaultValue={editingCustomer.name} autoFocus /></Field>
          <Field label="Telefone"><Input name="phone" required minLength={8} defaultValue={editingCustomer.phone} /></Field>
          <Field label="CPF" hint="Opcional"><Input name="cpf" defaultValue={editingCustomer.cpf || ""} placeholder="000.000.000-00" /></Field>
          <Field label="Endereço" hint="Opcional"><Input name="address" defaultValue={editingCustomer.address || ""} placeholder="Rua, número e bairro" /></Field>
          <div className="field-span"><Field label="Observações" hint="Opcional"><Textarea name="notes" rows={3} defaultValue={editingCustomer.notes || ""} placeholder="Informações úteis sobre o cliente" /></Field></div>
          {formError ? <div className="form-error field-span">{formError}</div> : null}
          <div className="form-actions field-span"><Button type="button" variant="ghost" onClick={() => setEditingCustomer(null)}>Cancelar</Button><Button type="submit" loading={saving}>Salvar alterações</Button></div>
        </form> : null}
      </Modal>
      <CustomerDetailModal key={selectedCustomer || "closed"} customerId={selectedCustomer} onClose={() => setSelectedCustomer(null)} onReport={onReport} onEdit={(customer) => { setSelectedCustomer(null); setEditingCustomer(customer); setFormError(""); }} />
    </div>
  );
}
