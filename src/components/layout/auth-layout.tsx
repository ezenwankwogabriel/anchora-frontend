import Image from "next/image";

interface TrustItem {
  text: string;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  tagline?: React.ReactNode;
  subtext?: string;
  trustItems?: TrustItem[];
  footerNote?: string;
}

const DEFAULT_TAGLINE = (
  <>
    Your financial life,{" "}
    <em className="text-[#93B4FF] not-italic">safely</em> organised for the
    people you love.
  </>
);

const DEFAULT_SUBTEXT =
  "Register your accounts. Designate who gets access. Anchora ensures nothing is lost if something happens to you.";

const DEFAULT_TRUST: TrustItem[] = [
  { text: "AES-256 encryption — your data is never readable by us" },
  { text: "Distributed trust model — no single point of failure" },
  { text: "Your beneficiaries are verified before receiving anything" },
];

const DEFAULT_FOOTER =
  "Anchora is a software information platform. We do not hold funds or execute financial transactions.";

export function AuthLayout({
  children,
  tagline = DEFAULT_TAGLINE,
  subtext = DEFAULT_SUBTEXT,
  trustItems = DEFAULT_TRUST,
  footerNote = DEFAULT_FOOTER,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <div
        className="w-[420px] flex-shrink-0 flex flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(160deg,#0D1526 0%,#141B34 60%,#1A2140 100%)",
        }}
      >
        {/* Logo */}
        <div>
          <Image
            src="/images/logo-full-transparent.png"
            alt="Anchora"
            width={80}
            height={80}
          />
        </div>

        {/* Hero */}
        <div className="my-auto">
          <h2 className="font-heading text-[32px] text-white leading-[1.25] mb-4">
            {tagline}
          </h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.65)] leading-[1.6] mb-7">
            {subtext}
          </p>
          {trustItems.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              {trustItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-[10px] text-[rgba(255,255,255,0.75)] text-[13px]"
                >
                  <div className="w-7 h-7 bg-[rgba(255,255,255,0.10)] rounded-[7px] flex items-center justify-center flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-[11.5px] text-[rgba(255,255,255,0.40)] border-t border-[rgba(255,255,255,0.10)] pt-5">
          {footerNote}
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-12 bg-bg">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
