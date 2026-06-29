"use client";

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "#7E93B0",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    </form>
  );
}
