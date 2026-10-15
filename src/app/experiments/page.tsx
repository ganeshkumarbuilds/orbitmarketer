"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { createVariants, type SourceAsset } from "@/lib/experiment-variants";
import {
  evaluateExperiment,
  validateMetrics,
  type ExperimentVariant,
} from "@/lib/experiments";

type CampaignOption = { id: string; name: string };
type SavedAsset = SourceAsset & { campaignId: string };
type ExperimentRecord = {
  id: string;
  campaignId: string;
  name: string;
  variants: ExperimentVariant[];
  minimumImpressions: number;
  winner: string | null;
  readyToDeclareWinner: boolean;
  evaluations?: ReturnType<typeof evaluateExperiment>["evaluations"];
};

function safeNumber(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function ExperimentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [experimentName, setExperimentName] = useState("Northstar A/B/C Test");
  const [minimumImpressions, setMinimumImpressions] = useState("100");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  async function loadData(currentUser: User) {
    setLoading(true);
    setError("");
    try {
      const [campaignSnapshot, assetSnapshot, experimentSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, "campaigns"),
          where("ownerId", "==", currentUser.uid),
        )),
        getDocs(query(
          collection(db, "assets"),
          where("ownerId", "==", currentUser.uid),
        )),
        getDocs(query(
          collection(db, "experiments"),
          where("ownerId", "==", currentUser.uid),
        )),
      ]);

      const campaignOptions = campaignSnapshot.docs.map((item) => {
        const data = item.data();
        const brief = data.brief ?? {};
        return {
          id: item.id,
          name: String(
            data.name ??
            brief.product ??
            data.product ??
            `Campaign ${item.id.slice(0, 6)}`
          ),
        };
      });

      const savedAssets: SavedAsset[] = assetSnapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          campaignId: String(data.campaignId ?? ""),
          type: String(data.type ?? "asset"),
          title: String(data.title ?? "Untitled asset"),
          content: String(data.content ?? ""),
          angle: typeof data.angle === "string" ? data.angle : "curiosity",
        };
      }).filter((item) => item.content.trim().length > 0);

      const savedExperiments: ExperimentRecord[] = experimentSnapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          campaignId: String(data.campaignId ?? ""),
          name: String(data.name ?? "Untitled experiment"),
          variants: Array.isArray(data.variants) ? data.variants as ExperimentVariant[] : [],
          minimumImpressions: Number(data.minimumImpressions ?? 100),
          winner: typeof data.winner === "string" ? data.winner : null,
          readyToDeclareWinner: Boolean(data.readyToDeclareWinner),
          evaluations: Array.isArray(data.evaluations) ? data.evaluations : undefined,
        };
      });

      setCampaigns(campaignOptions);
      setAssets(savedAssets);
      setExperiments(savedExperiments);

      if (!campaignId && campaignOptions.length) setCampaignId(campaignOptions[0].id);
      if (!assetId && savedAssets.length) setAssetId(savedAssets[0].id);
    } catch (loadError) {
      console.error("Failed to load experiment data:", loadError);
      setError("Couldn't load campaigns. Confirm Firestore rules include owner-only access to experiments, campaigns, and assets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadData(user);
    else {
      setCampaigns([]);
      setAssets([]);
      setExperiments([]);
    }
    // Load only when auth changes; refresh after writes explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const campaignAssets = useMemo(
    () => assets.filter((asset) => asset.campaignId === campaignId),
    [assets, campaignId],
  );
  const selectedAsset = campaignAssets.find((asset) => asset.id === assetId);

  async function createExperiment(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!user) {
      setError("Sign in before creating an experiment.");
      return;
    }
    if (!selectedAsset) {
      setError("Select a saved campaign asset first.");
      return;
    }

    const minSamples = Number(minimumImpressions);
    if (!Number.isInteger(minSamples) || minSamples < 1 || minSamples > 1000000) {
      setError("Minimum impressions must be a whole number between 1 and 1,000,000.");
      return;
    }

    setSaving(true);
    try {
      const variants = createVariants(selectedAsset);
      const evaluation = evaluateExperiment(variants, minSamples);

      const record = {
        ownerId: user.uid,
        campaignId,
        sourceAssetId: selectedAsset.id,
        name: experimentName.trim() || `${selectedAsset.title} experiment`,
        status: "running",
        variants,
        minimumImpressions: minSamples,
        winner: evaluation.winner,
        readyToDeclareWinner: evaluation.readyToDeclareWinner,
        evaluations: evaluation.evaluations,
        budgetSplit: evaluation.evaluations.map((item) => ({
          variantId: item.id,
          percent: item.budgetPercent,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const reference = await addDoc(collection(db, "experiments"), record);
      setNotice(`Experiment created with variants A, B, and C. ID: ${reference.id}`);
      await loadData(user);
    } catch (saveError) {
      console.error("Experiment creation failed:", saveError);
      setError("Couldn't save the experiment. Check Firestore rules and the terminal console.");
    } finally {
      setSaving(false);
    }
  }

  async function updateVariantMetric(
    experiment: ExperimentRecord,
    variantId: "A" | "B" | "C",
    metric: "impressions" | "clicks" | "conversions",
    value: string,
  ) {
    if (!user) return;
    setError("");
    setNotice("");

    const numericValue = safeNumber(value);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
      setError("Metrics must be non-negative whole numbers.");
      return;
    }

    const variants = experiment.variants.map((variant) =>
      variant.id === variantId
        ? { ...variant, metrics: { ...variant.metrics, [metric]: numericValue } }
        : variant,
    );

    for (const variant of variants) {
      const validationError = validateMetrics(variant.metrics);
      if (validationError) {
        setError(`${variant.label}: ${validationError}`);
        return;
      }
    }

    try {
      const evaluation = evaluateExperiment(variants, experiment.minimumImpressions);
      await updateDoc(doc(db, "experiments", experiment.id), {
        variants,
        winner: evaluation.winner,
        readyToDeclareWinner: evaluation.readyToDeclareWinner,
        evaluations: evaluation.evaluations,
        budgetSplit: evaluation.evaluations.map((item) => ({
          variantId: item.id,
          percent: item.budgetPercent,
        })),
        status: evaluation.readyToDeclareWinner ? "evaluated" : "running",
        updatedAt: serverTimestamp(),
      });
      setNotice(
        evaluation.readyToDeclareWinner
          ? `Metrics saved. Minimum sample threshold reached; current leading variant: ${evaluation.winner}.`
          : `Metrics saved. No winner declared: every variant needs at least ${experiment.minimumImpressions} impressions.`,
      );
      await loadData(user);
    } catch (updateError) {
      console.error("Metric update failed:", updateError);
      setError(updateError instanceof Error ? updateError.message : "Could not update experiment metrics.");
    }
  }

  if (!authReady) {
    return <main className="min-h-screen bg-[#09090b] p-8 text-white">Checking sign-in…</main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#09090b] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-semibold">Experiment Engine</h1>
          <p className="mt-3 text-sm text-zinc-400">Sign in to create A/B/C tests from saved OrbitMarketer campaign assets.</p>
          <a className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium" href="/login">Go to login</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">OrbitMarketer · Optimization</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Experiment Engine</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Create three variants, record real performance metrics, enforce a minimum sample size, and calculate a recommended budget split.
            </p>
          </div>
          <a href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Back to dashboard</a>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={createExperiment} className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Create A/B/C experiment</h2>
            <p className="mt-1 text-sm text-zinc-400">Variants are derived from an asset already saved to Firestore.</p>

            <label className="mt-5 block text-sm text-zinc-300">Campaign</label>
            <select value={campaignId} onChange={(event) => {
              const nextId = event.target.value;
              setCampaignId(nextId);
              const firstAsset = assets.find((asset) => asset.campaignId === nextId);
              setAssetId(firstAsset?.id ?? "");
            }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-violet-400">
              {campaigns.length === 0 && <option value="">No saved campaigns found</option>}
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.id.slice(0, 6)}</option>)}
            </select>

            <label className="mt-4 block text-sm text-zinc-300">Source asset</label>
            <select value={assetId} onChange={(event) => setAssetId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-violet-400">
              {campaignAssets.length === 0 && <option value="">No assets for this campaign</option>}
              {campaignAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.type} — {asset.title}</option>)}
            </select>

            {selectedAsset && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Source preview</p>
                <p className="mt-2 text-sm text-zinc-300">{selectedAsset.content.slice(0, 260)}{selectedAsset.content.length > 260 ? "…" : ""}</p>
              </div>
            )}

            <label className="mt-4 block text-sm text-zinc-300">Experiment name</label>
            <input value={experimentName} onChange={(event) => setExperimentName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-violet-400" />

            <label className="mt-4 block text-sm text-zinc-300">Minimum impressions per variant before a winner can be declared</label>
            <input type="number" min={1} max={1000000} step={1} value={minimumImpressions} onChange={(event) => setMinimumImpressions(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-violet-400" />
            <p className="mt-2 text-xs leading-5 text-zinc-500">Default: 100 impressions per variant. The app will not declare a winner until A, B, and C each reach this threshold.</p>

            <button disabled={saving || loading || campaigns.length === 0 || !selectedAsset} className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Creating experiment…" : "Create A/B/C experiment"}
            </button>
            {loading && <p className="mt-3 text-xs text-zinc-500">Loading saved campaigns…</p>}
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Saved experiments</h2>
                <p className="mt-1 text-sm text-zinc-400">Enter observed counts for each variant. The app validates metric consistency.</p>
              </div>
              <button type="button" onClick={() => user && void loadData(user)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">Refresh</button>
            </div>

            {experiments.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
                <p className="text-sm text-zinc-300">No experiments yet.</p>
                <p className="mt-1 text-xs text-zinc-500">Create your first A/B/C test using the form.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {experiments.map((experiment) => {
                  const evaluation = evaluateExperiment(experiment.variants, experiment.minimumImpressions);
                  return (
                    <article key={experiment.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{experiment.name}</h3>
                          <p className="mt-1 text-xs text-zinc-500">ID {experiment.id} · minimum {experiment.minimumImpressions} impressions per variant</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${evaluation.readyToDeclareWinner ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-200"}`}>
                          {evaluation.readyToDeclareWinner ? `Leader: ${evaluation.winner}` : "Collecting data"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        {experiment.variants.map((variant) => {
                          const stats = evaluation.evaluations.find((item) => item.id === variant.id)!;
                          return (
                            <div key={variant.id} className="rounded-lg border border-white/10 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">Variant {variant.id} · {variant.label}</p>
                                  <p className="mt-1 text-xs text-zinc-400">{variant.title}</p>
                                </div>
                                <span className="text-xs text-violet-200">Suggested budget: {stats.budgetPercent.toFixed(1)}%</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{variant.content}</p>

                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {(["impressions", "clicks", "conversions"] as const).map((metric) => (
                                  <label key={metric} className="text-[11px] capitalize text-zinc-500">
                                    {metric}
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={variant.metrics[metric]}
                                      onChange={(event) => {
                                        const next = safeNumber(event.target.value);
                                        if (!Number.isInteger(next) || next < 0) {
                                          setError("Metrics must be non-negative whole numbers.");
                                          return;
                                        }
                                        const variants = experiment.variants.map((item) =>
                                          item.id === variant.id
                                            ? { ...item, metrics: { ...item.metrics, [metric]: next } }
                                            : item,
                                        );
                                        // Keep typing responsive; persistence happens on the Save metrics button.
                                        setExperiments((current) => current.map((item) =>
                                          item.id === experiment.id ? { ...item, variants } : item,
                                        ));
                                      }}
                                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#09090b] px-2 py-2 text-sm text-white outline-none focus:border-violet-400"
                                    />
                                  </label>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-zinc-500">
                                CTR {(stats.ctr * 100).toFixed(2)}% · conversion rate {(stats.conversionRate * 100).toFixed(2)}% · {stats.impressions >= experiment.minimumImpressions ? "sample threshold met" : `${Math.max(0, experiment.minimumImpressions - stats.impressions)} impressions to threshold`}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const latest = experiments.find((item) => item.id === experiment.id);
                                  if (!latest) return;
                                  const currentVariant = latest.variants.find((item) => item.id === variant.id);
                                  if (!currentVariant) return;
                                  void updateVariantMetric(latest, variant.id, "impressions", String(currentVariant.metrics.impressions));
                                }}
                                className="mt-3 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                              >
                                Save {variant.id} metrics
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 rounded-xl border border-white/10 p-3">
                        <h4 className="text-sm font-medium">Optimization recommendation</h4>
                        {evaluation.readyToDeclareWinner ? (
                          <p className="mt-2 text-sm text-emerald-200">Current leading variant: {evaluation.winner}. This is an observed leader, not a guarantee of future performance.</p>
                        ) : (
                          <p className="mt-2 text-sm text-amber-100">No winner declared. Each variant needs at least {experiment.minimumImpressions} impressions.</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {evaluation.evaluations.map((item) => (
                            <span key={item.id} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300">
                              {item.id}: {item.budgetPercent.toFixed(1)}% budget · {(item.conversionRate * 100).toFixed(2)}% conversion rate
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
