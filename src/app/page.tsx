import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  FileText,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Brand Brain",
    description:
      "Upload PDF brand guidelines, extract candidate rules, and reference your brand requirements while creating campaigns.",
  },
  {
    icon: WandSparkles,
    title: "Campaign Generator",
    description:
      "Generate hooks, reel scripts, ads, emails, and landing-page sections with distinct creative angles.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance checks",
    description:
      "Check selected risky claims and prohibited phrases, with conservative rewrites. Human review remains important.",
  },
  {
    icon: BadgeCheck,
    title: "Embedding deduplication",
    description:
      "Compare asset embeddings and review potential near-duplicates before removing anything.",
  },
  {
    icon: FlaskConical,
    title: "A/B/C experiments",
    description:
      "Create three variants, record actual metrics, enforce minimum sample sizes, and review budget recommendations.",
  },
  {
    icon: FileText,
    title: "Traceable assets",
    description:
      "Inspect creative angles and references to supplied brand rules for each generated asset.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Upload brand guidelines",
    description: "Extract candidate rules from your PDF.",
  },
  {
    number: "02",
    title: "Generate five assets",
    description: "Create distinct formats and creative angles.",
  },
  {
    number: "03",
    title: "Check and deduplicate",
    description: "Review compliance flags and embedding similarity.",
  },
  {
    number: "04",
    title: "Run an experiment",
    description: "Record metrics and respect minimum sample sizes.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090b10] text-slate-100">
      {/* Navigation */}
      <header className="border-b border-white/[0.08] bg-[#0c0e14]/90">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold shadow-lg shadow-violet-600/20">
              O
            </span>

            <span>
              <span className="block text-lg font-bold tracking-tight">
                Orbit<span className="text-violet-400">Marketer</span>
              </span>
              <span className="block text-[10px] tracking-[0.18em] text-slate-500">
                BRAND INTELLIGENCE
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Log in
            </Link>

            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute -right-28 -top-16 -z-10 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-24 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
              <Sparkles size={14} />
              Brand-aware marketing workflow
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Every campaign.
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                Consistent by design.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Generate brand-aware marketing assets, check selected
              compliance risks, find semantic near-duplicates, and compare
              campaign variants in one workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
              >
                Get started
                <ArrowRight size={16} />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]"
              >
                Explore features
              </a>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Assessment demo · Sample dashboard metrics are illustrative,
              not live campaign results.
            </p>
          </div>

          {/* Product preview */}
          <div className="rounded-3xl border border-violet-400/15 bg-gradient-to-br from-[#17132b] via-[#111522] to-[#0e1119] p-5 shadow-2xl shadow-violet-950/20 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-sm font-semibold">Campaign workflow</p>
                <p className="mt-1 text-xs text-slate-500">
                  From guidelines to experiments
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                Product preview
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {workflow.map((step) => (
                <div
                  key={step.number}
                  className="flex gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-xs font-semibold text-violet-200">
                    {step.number}
                  </span>

                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {step.description}
                    </p>
                  </div>

                  <CheckCircle2
                    size={16}
                    className="ml-auto mt-1 shrink-0 text-emerald-300"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div>
                <p className="text-xs text-slate-500">Creative formats</p>
                <p className="mt-1 text-sm font-semibold">
                  Hook · Reel · Ad · Email · Landing page
                </p>
              </div>

              <Sparkles className="text-violet-300" size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        id="features"
        className="border-y border-white/[0.07] bg-white/[0.015]"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              What it does
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A thoughtful workflow for on-brand campaigns
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              Keep brand rules, creative generation, review, similarity
              checks, and experiments connected.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-6 transition hover:border-violet-400/20"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                    <Icon size={20} />
                  </span>

                  <h3 className="mt-4 text-base font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="rounded-3xl border border-violet-400/15 bg-gradient-to-r from-[#18132d] to-[#101827] p-7 sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Ready to build your next campaign?
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Sign in to access your workspace, upload brand rules, and start
            building campaigns.
          </p>

          <Link
            href="/login?mode=signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500"
          >
            Get started
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>OrbitMarketer · Brand-consistent campaign engine</p>
          <p>Assessment project · AI-assisted content requires human review</p>
        </div>
      </footer>
    </main>
  );
}