import { useEffect, useState } from "react";
import { AppShell, type AppPage } from "./components/AppShell";
import { LoanReportModal } from "./components/LoanReportModal";
import { LoadingState, Toast } from "./components/UI";
import { api, getAccessToken, setAccessToken, setUnauthorizedHandler } from "./lib/api";
import { AuthPage } from "./pages/AuthPage";
import { CashPage } from "./pages/CashPage";
import { CollectionsPage, PaymentModal } from "./pages/CollectionsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoanFormModal, LoansPage } from "./pages/LoansPage";
import { ReportsPage } from "./pages/ReportsPage";
import type { AuthSession, CollectionItem, Loan, User } from "./types";

type ToastState = { message: string; tone: "success" | "error" } | null;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(getAccessToken()));
  const [page, setPage] = useState<AppPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ loanId: string; preset?: CollectionItem | null } | null>(null);
  const [reportLoan, setReportLoan] = useState<Loan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    if (!getAccessToken()) return;
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setAccessToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setUser(null);
      setToast({ message: "Sua sessão expirou. Entre novamente.", tone: "error" });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function authenticated(session: AuthSession) {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }

  function logout() {
    setAccessToken(null);
    setUser(null);
    setPage("dashboard");
  }

  function saved(message: string) {
    setRefreshKey((value) => value + 1);
    setToast({ message, tone: "success" });
  }

  function payLoan(loan: Loan) {
    setPaymentTarget({ loanId: loan.id });
  }

  function loanCreated(loan: Loan) {
    saved("Empréstimo criado e agenda de cobranças gerada.");
    setReportLoan(loan);
  }

  if (checkingSession) {
    return <div className="boot-screen"><div className="brand-mark"><span>M</span></div><LoadingState label="Abrindo seu MFlow" /></div>;
  }

  if (!user) return <AuthPage onAuthenticated={authenticated} />;

  return (
    <>
      <AppShell page={page} onNavigate={setPage} user={user} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onSearch={(query) => { setCustomerSearch(query); setPage("customers"); }}>
        {page === "dashboard" ? <DashboardPage refreshKey={refreshKey} onNavigate={setPage} onNewLoan={() => setLoanModalOpen(true)} /> : null}
        {page === "customers" ? <CustomersPage key={customerSearch} refreshKey={refreshKey} onCreated={saved} onReport={setReportLoan} externalSearch={customerSearch} /> : null}
        {page === "loans" ? <LoansPage refreshKey={refreshKey} onNewLoan={() => setLoanModalOpen(true)} onPayment={payLoan} onReport={setReportLoan} /> : null}
        {page === "collections" ? <CollectionsPage refreshKey={refreshKey} onPayment={(preset) => setPaymentTarget({ loanId: preset.loanId, preset })} /> : null}
        {page === "cash" ? <CashPage refreshKey={refreshKey} onSaved={saved} /> : null}
        {page === "reports" ? <ReportsPage refreshKey={refreshKey} /> : null}
      </AppShell>
      <LoanFormModal open={loanModalOpen} onClose={() => setLoanModalOpen(false)} onCreated={loanCreated} />
      {paymentTarget ? <PaymentModal loanId={paymentTarget.loanId} preset={paymentTarget.preset} onClose={() => setPaymentTarget(null)} onSaved={saved} /> : null}
      <LoanReportModal loan={reportLoan} onClose={() => setReportLoan(null)} />
      {toast ? <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </>
  );
}

export default App;
