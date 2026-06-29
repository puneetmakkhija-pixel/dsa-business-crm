import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in — BuddyLoan Partner CRM" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[400px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
            </svg>
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">BuddyLoan</div>
            <div className="font-display text-[19px] font-bold text-slate-900">Partner CRM</div>
          </div>
        </div>
        <p className="mb-6 text-[12.5px] text-slate-500">DSA Reconciliation · Billing · Accounting</p>
        <LoginForm />
      </div>
    </div>
  );
}
