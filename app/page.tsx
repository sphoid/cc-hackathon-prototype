import Link from "next/link";

const demos = [
  {
    href: "/bookkeeping",
    brand: "LedgerLite",
    title: "Bookkeeping",
    description: "Generate invoices, ledgers, and financial dashboards.",
  },
  {
    href: "/ecommerce",
    brand: "ShopWave",
    title: "E-Commerce",
    description: "Build product pages, carts, and storefront UIs.",
  },
  {
    href: "/project-management",
    brand: "TaskFlow",
    title: "Project Management",
    description: "Create boards, timelines, and team dashboards.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-2">Dynamic UI Workflow Engine</h1>
      <p className="text-zinc-500 mb-10 text-center max-w-lg">
        Schema-driven UI generation powered by Claude. Pick a demo to get started.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {demo.brand}
            </span>
            <h2 className="text-lg font-semibold mt-1 mb-2 group-hover:text-zinc-900">
              {demo.title}
            </h2>
            <p className="text-sm text-zinc-500">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
