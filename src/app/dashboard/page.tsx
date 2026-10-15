import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Command,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";

const stats = [
  {
    label: "Campaigns generated",
    value: "24",
    change: "+18.2%",
    positive: true,
    icon: Sparkles,
  },
  {
    label: "Assets created",
    value: "186",
    change: "+12.5%",
    positive: true,
    icon: FileText,
  },
  {
    label: "Brand compliance",
    value: "96.8%",
    change: "+4.3%",
    positive: true,
    icon: ShieldCheck,
  },
  {
    label: "Duplicates prevented",
    value: "32",
    change: "-8.4%",
    positive: false,
    icon: Activity,
  },
];

const campaigns = [
  {
    name: "Q4 Product Launch",
    channel: "LinkedIn",
    assets: 12,
    status: "Completed",
    date: "Oct 14, 2026",
  },
  {
    name: "Autumn Growth Campaign",
    channel: "Email",
    assets: 8,
    status: "In progress",
    date: "Oct 13, 2026",
  },
  {
    name: "Brand Awareness Series",
    channel: "Blog & Social",
    assets: 15,
    status: "Completed",
    date: "Oct 12, 2026",
  },
  {
    name: "Customer Success Stories",
    channel: "Landing page",
    assets: 6,
    status: "Needs review",
    date: "Oct 11, 2026",
  },
];

const navigation = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Campaigns",
    icon: FileText,
    href: "/campaigns/new",
  },
  {
    label: "Brand Brain",
    icon: BookOpen,
    href: "/brand-brain",
  },
  {
    label: "Experiments",
    icon: FlaskConical,
    href: "/experiments",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/experiments",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#090b10] text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.07] bg-[#0c0e14] p-5 lg:flex lg:flex-col">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-2 py-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
              <Command size={23} strokeWidth={2.4} />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Orbit<span className="text-violet-400">Marketer</span>
              </p>

              <p className="text-[11px] text-slate-500">
                BRAND INTELLIGENCE
              </p>
            </div>
          </Link>

          <div className="mt-10">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = item.label === "Overview";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-violet-500/15 font-medium text-violet-300"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />

                    {item.label}

                    {item.label === "Brand Brain" && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Brand Brain shortcut */}
          <Link
            href="/brand-brain"
            className="mt-10 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-blue-500/[0.04] p-4 transition hover:border-violet-400/30"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Zap size={19} />
            </div>

            <p className="text-sm font-semibold">Brand Brain</p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your brand knowledge powers every campaign.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-violet-400" />
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Open brand guidelines
            </p>
          </Link>

          <div className="mt-auto space-y-1 border-t border-white/[0.07] pt-4">
            <a
              href="mailto:support@orbitmarketer.example"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <CircleHelp size={18} />
              Help & support
            </a>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Settings size={18} />
              Settings
            </Link>

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.035] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-sm font-bold">
                OM
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  Workspace
                </p>

                <p className="truncate text-xs text-slate-500">
                  Marketing workspace
                </p>
              </div>

              <ChevronDown size={15} className="text-slate-500" />
            </div>
          </div>
        </aside>

        {/* Main workspace */}
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#090b10]/90 px-5 backdrop-blur-xl sm:px-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Workspace
                <span>/</span>
                <span className="text-slate-300">Overview</span>
              </div>

              <h1 className="mt-1 text-lg font-semibold">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                aria-label="Search and create campaigns"
                href="/campaigns/new"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white sm:flex"
              >
                <Search size={18} />
              </Link>

              <Link
                aria-label="View experiments"
                href="/experiments"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <Bell size={18} />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              </Link>

              <Link
                href="/campaigns/new"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500"
              >
                <Plus size={17} />

                <span className="hidden sm:inline">
                  New campaign
                </span>
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-8 p-5 sm:p-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-r from-[#17132b] via-[#15142a] to-[#101827] p-6 sm:p-9">
              <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="pointer-events-none absolute right-1/4 top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                  <Sparkles size={13} />
                  AI-powered brand intelligence
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Every campaign.
                  <br />

                  <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                    Consistent by design.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Create on-brand marketing assets across every channel.
                  Ground your content in brand knowledge, catch duplicates,
                  and improve campaigns with measurable experiments.
                </p>

                {/* Functional primary actions */}
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/campaigns/new"
                    className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
                  >
                    <WandSparkles size={17} />
                    Generate campaign
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    href="/brand-brain"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    <Upload size={16} />
                    Upload brand guidelines
                  </Link>
                </div>

                <div className="relative mt-8 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/[0.08] pt-5 sm:mt-10">
                  <div>
                    <p className="text-xs text-slate-500">
                      Content channels
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      05
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Brand rules
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      Per upload
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      AI workflow
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-300">
                      <CheckCircle2 size={15} />
                      Available
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Metrics: illustrative, not live data */}
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">
                    Performance overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Illustrative dashboard metrics
                  </p>
                </div>

                <span className="hidden text-sm text-slate-500 sm:block">
                  Sample data
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      key={stat.label}
                      className="rounded-2xl border border-white/[0.07] bg-[#0e1119] p-5 transition hover:border-white/[0.14]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                          {stat.label}
                        </p>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                          <Icon size={18} />
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <p className="text-3xl font-semibold tracking-tight">
                          {stat.value}
                        </p>

                        <span
                          className={`mb-1 inline-flex items-center gap-1 text-xs font-medium ${
                            stat.positive
                              ? "text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          {stat.positive ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}

                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-600">
                        Sample metrics · Not live data
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Recent campaigns and shortcuts */}
            <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              <div
                id="campaigns"
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e1119]"
              >
                <div className="flex items-center justify-between border-b border-white/[0.07] p-5 sm:p-6">
                  <div>
                    <h2 className="font-semibold">
                      Recent campaigns
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Sample campaigns for the interface preview
                    </p>
                  </div>

                  <Link
                    href="/campaigns/new"
                    className="flex items-center gap-1 text-sm text-violet-300 transition hover:text-violet-200"
                  >
                    Create campaign
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[570px] text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium sm:px-6">
                          Campaign
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Assets
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Status
                        </th>

                        <th className="px-5 py-3 font-medium sm:px-6">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.05]">
                      {campaigns.map((campaign) => (
                        <tr
                          key={campaign.name}
                          className="transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-medium text-slate-200">
                              {campaign.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {campaign.channel}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {campaign.assets}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                campaign.status === "Completed"
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : campaign.status === "In progress"
                                    ? "bg-blue-400/10 text-blue-300"
                                    : "bg-amber-400/10 text-amber-300"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {campaign.status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 sm:px-6">
                            {campaign.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-white/[0.06] px-6 py-3 text-xs text-slate-600">
                  Example data only. Campaigns are not connected to a
                  database yet.
                </div>
              </div>

              <div className="space-y-6">
                {/* Brand Brain shortcut */}
                <section
                  id="brand-brain"
                  className="rounded-2xl border border-white/[0.07] bg-[#0e1119] p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold">
                        Brand Brain
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Knowledge source status
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                      <BookOpen size={18} />
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-dashed border-white/[0.12] p-5 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400">
                      <Upload size={20} />
                    </div>

                    <p className="mt-3 text-sm font-medium">
                      Connect your brand knowledge
                    </p>

                    <p className="mx-auto mt-1 max-w-[230px] text-xs leading-5 text-slate-500">
                      Upload a PDF to ground future campaigns in your
                      brand guidelines.
                    </p>

                    <Link
                      href="/brand-brain"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.05]"
                    >
                      <Plus size={15} />
                      Add brand document
                    </Link>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Open Brand Brain to view saved documents
                  </div>
                </section>

                {/* Experiments shortcut */}
                <section
                  id="experiments"
                  className="rounded-2xl border border-white/[0.07] bg-[#0e1119] p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      Experiment engine
                    </h2>

                    <FlaskConical
                      size={18}
                      className="text-violet-300"
                    />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Compare campaign variants and use performance metrics
                    to improve future recommendations.
                  </p>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        label: "Variant A",
                        width: "50%",
                        color: "bg-violet-400",
                      },
                      {
                        label: "Variant B",
                        width: "30%",
                        color: "bg-blue-400",
                      },
                      {
                        label: "Variant C",
                        width: "20%",
                        color: "bg-emerald-400",
                      },
                    ].map((variant) => (
                      <div key={variant.label}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-slate-400">
                            {variant.label}
                          </span>

                          <span className="text-slate-300">
                            {variant.width}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full ${variant.color}`}
                            style={{ width: variant.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[11px] text-slate-600">
                    Illustrative weights · No experiment is running yet
                  </p>

                  <Link
                    href="/experiments"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300 transition hover:text-violet-200"
                  >
                    Open experiments
                    <ArrowRight size={15} />
                  </Link>
                </section>
              </div>
            </section>

            <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.06] py-5 text-xs text-slate-600 sm:flex-row">
              <p>
                OrbitMarketer · Brand-consistent campaign engine
              </p>

              <p>
                Assessment project · Dashboard metrics are illustrative
              </p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}