interface AuthLayoutProps {
  children: React.ReactNode;
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] text-[rgba(255,255,255,0.75)] text-[13px]">
      <div className="w-7 h-7 bg-[rgba(255,255,255,0.10)] rounded-[7px] flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      {children}
    </div>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div
        className="w-[420px] flex-shrink-0 flex flex-col justify-between p-12"
        style={{
          background: "linear-gradient(160deg,#0F2060 0%,#1E3A8A 50%,#1A3A8F 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-[10px]">
          <div className="w-9 h-9 bg-[rgba(255,255,255,0.15)] rounded-[9px] flex items-center justify-center border border-[rgba(255,255,255,0.2)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L4 7V12C4 16.4 7.4 20.5 12 21C16.6 20.5 20 16.4 20 12V7L12 3Z"
                fill="white"
                opacity=".9"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity=".6"
              />
            </svg>
          </div>
          <span className="font-heading text-[20px] text-white">Anchora</span>
        </div>

        {/* Hero */}
        <div className="my-auto">
          <h2 className="font-heading text-[32px] text-white leading-[1.25] mb-4">
            Your financial life,{" "}
            <em className="text-[#93B4FF] not-italic">safely</em>{" "}
            organised for the people you love.
          </h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.65)] leading-[1.6] mb-7">
            Register your accounts. Designate who gets access. Anchora ensures
            nothing is lost if something happens to you.
          </p>
          <div className="flex flex-col gap-[10px]">
            <TrustItem>AES-256 encryption — your data is never readable by us</TrustItem>
            <TrustItem>Distributed trust model — no single point of failure</TrustItem>
            <TrustItem>Your beneficiaries are verified before receiving anything</TrustItem>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-[11.5px] text-[rgba(255,255,255,0.40)] border-t border-[rgba(255,255,255,0.10)] pt-5">
          Anchora is a software information platform. We do not hold funds or
          execute financial transactions.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-12 bg-bg">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
