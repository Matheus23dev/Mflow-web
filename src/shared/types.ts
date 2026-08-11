export type User = { id: string; name: string; email: string };

export type AuthSession = { accessToken: string; user: User };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  cpf?: string | null;
  address?: string | null;
  notes?: string | null;
  loans?: Array<{ id: string; status: LoanStatus; principalBalance: string; totalContracted: string; openBalance: number }>;
  _count?: { loans: number };
};

export type LoanType = "WEEKLY" | "MONTHLY_INTEREST";
export type LoanStatus = "ACTIVE" | "OVERDUE" | "PAID" | "RENEWED" | "CANCELLED";
export type ChargeStatus = "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
export type ReceiptKind = "LOAN_DISBURSEMENT" | "PAYMENT" | "RENEWAL";

export type Receipt = {
  id: string;
  loanId: string;
  paymentId?: string | null;
  kind: ReceiptKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ReceiptStorageStatus = {
  configured: boolean;
  usedBytes: number;
  warningBytes: number;
  criticalBytes: number;
  hardLimitBytes: number;
  freeLimitBytes: number;
  remainingBytes: number;
  percent: number;
  level: "NORMAL" | "WARNING" | "CRITICAL" | "BLOCKED";
  canUpload: boolean;
};

export type Charge = {
  id: string;
  number?: number;
  referenceMonth?: string;
  dueDate: string;
  amount?: string;
  interestAmount?: string;
  paidAmount: string;
  status: ChargeStatus;
};

export type Loan = {
  id: string;
  customerId: string;
  customer: Pick<Customer, "id" | "name" | "phone" | "cpf" | "address">;
  type: LoanType;
  frequency?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  principalAmount: string;
  principalBalance: string;
  releasedAmount: string;
  totalContracted: string;
  installmentCount?: number | null;
  installmentAmount?: string | null;
  monthlyInterestRate?: string | null;
  monthlyInterestAmount?: string | null;
  lateFeePerDay: string;
  loanDate: string;
  firstDueDate?: string | null;
  monthlyDueDay?: number | null;
  status: LoanStatus;
  installments: Charge[];
  monthlyCharges: Charge[];
  payments: Payment[];
  receipts: Receipt[];
  summary: {
    received: number;
    openBalance: number;
    paidCount: number;
    totalCount: number;
    nextDue?: string | null;
    overdueCount: number;
    lateFees: number;
  };
};

export type CollectionItem = {
  id: string;
  loanId: string;
  customer: Pick<Customer, "id" | "name" | "phone">;
  type: LoanType;
  label: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  outstanding: number;
  daysOverdue: number;
  lateFee: number;
  updatedAmount: number;
  status: ChargeStatus;
};

export type Payment = {
  id: string;
  loanId: string;
  type: "INSTALLMENT" | "INTEREST" | "PRINCIPAL" | "PAYOFF" | "RENEWAL_ENTRY";
  amount: string;
  lateFeeAmount?: string;
  paymentDate: string;
  paymentMethod: "PIX" | "CASH" | "TRANSFER" | "OTHER";
  notes?: string | null;
  loanStatus?: LoanStatus;
  customer?: Pick<Customer, "id" | "name">;
  loan?: { id: string; type: LoanType };
  installment?: { number: number; dueDate: string } | null;
  monthlyCharge?: { referenceMonth: string; dueDate: string } | null;
};

export type CustomerDetails = Omit<Customer, "loans"> & {
  loans: Loan[];
  payments: Payment[];
  stats: {
    totalLent: string;
    totalReceived: string;
    totalOpen: string;
    loanCount: number;
    overdueCount: number;
  };
};

export type DashboardData = {
  metrics: {
    capitalLent: number;
    totalExpected: number;
    totalReceived: number;
    receivedThisMonth: number;
    openBalance: number;
    overdueAmount: number;
    activeCustomers: number;
    activeLoans: number;
    overdueLoans: number;
    renewals: number;
  };
  upcoming: CollectionItem[];
};

export type CashData = {
  transactions: Array<{
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: string;
    description: string;
    createdAt: string;
    loan?: { id: string; customer: Pick<Customer, "id" | "name"> } | null;
  }>;
  summary: { income: number; expense: number; balance: number };
};

export type ReportData = {
  period: { from: string | null; to: string | null };
  metrics: {
    totalLent: number;
    totalReceived: number;
    interestReceived: number;
    capitalRecovered: number;
    openBalance: number;
    overdue: number;
    realizedProfit: number;
    projectedProfit: number;
  };
};
