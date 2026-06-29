import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in — BuddyLoan Partner CRM" };

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(1200px 600px at 18% -8%, #15315A 0%, #0B1D36 45%, #07111F 100%)",
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: "34px 32px",
          background:
            "linear-gradient(158deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 30px 60px -28px rgba(0,0,0,0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 22px -6px rgba(91,141,239,0.6)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#7E93B0", fontWeight: 600 }}>BuddyLoan</div>
            <div
              style={{
                fontFamily: "var(--font-sora), sans-serif",
                fontSize: 19,
                fontWeight: 800,
                color: "#F4F8FE",
                letterSpacing: "-0.4px",
              }}
            >
              Partner CRM
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: "#7E93B0", marginBottom: 22 }}>
          DSA Reconciliation · Billing · Accounting
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
