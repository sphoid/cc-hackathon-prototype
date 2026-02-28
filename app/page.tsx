import Link from "next/link";

const demos = [
  {
    href: "/bookkeeping",
    brand: "LedgerLite",
    title: "Bookkeeping",
    description: "Invoices, ledgers, and financial dashboards.",
  },
  {
    href: "/ecommerce",
    brand: "ShopWave",
    title: "E-Commerce",
    description: "Product pages, carts, and storefront UIs.",
  },
  {
    href: "/project-management",
    brand: "TaskFlow",
    title: "Project Management",
    description: "Boards, timelines, and team dashboards.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="animate-fade-up max-w-2xl w-full">
        <p className="text-xs font-mono tracking-widest uppercase mb-6 text-[var(--accent)]">
          Workflow Engine
        </p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-tight mb-4 text-[var(--text-primary)]">
          Schema-driven
          <br />
          UI generation.
        </h1>
        <p className="text-base leading-relaxed mb-16 max-w-md text-[var(--text-secondary)]">
          Describe what you need. The engine builds it from structured workflow
          schemas, powered by Claude.
        </p>

        <div className="space-y-3">
          {demos.map((demo, i) => (
            <Link
              key={demo.href}
              href={demo.href}
              className="group flex items-center justify-between rounded-lg px-5 py-4 transition-all duration-200 animate-fade-up bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface)]"
              style={{ animationDelay: `${150 + i * 80}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono uppercase tracking-wider w-24 shrink-0 text-[var(--text-muted)]">
                  {demo.brand}
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {demo.title}
                </span>
                <span className="text-sm hidden sm:inline text-[var(--text-muted)]">
                  {demo.description}
                </span>
              </div>
              <span className="text-sm transition-transform duration-200 group-hover:translate-x-1 text-[var(--text-muted)]">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
