"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { deduplicateAssets } from "@/lib/dedupe";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clapperboard,
  FileText,
  LoaderCircle,
  Mail,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

type BrandDocument = {
  id: string;
  filename: string;
  rules: string[];
  ruleCount?: number;
  status?: string;
};

type CampaignAsset = {
  id: string;
  type: string;
  title: string;
  content: string;
  angle: "authority" | "urgency" | "curiosity" | "proof" | "fear-to-relief";
  brandRuleIds: number[];
  brandRuleQuotes: string[];
  policyFlags: string[];
  complianceStatus: string;
};

type GenerationResponse = {
  success?: boolean;
  error?: string;
  details?: unknown;
  model?: string;
  assets?: CampaignAsset[];
};

const channels = [
  "Instagram",
  "Email",
  "Facebook",
  "Landing page",
  "Google Ads",
];

const angleStyles: Record<string, string> = {
  authority: "bg-violet-500/15 text-violet-300 border-violet-400/20",
  urgency: "bg-orange-500/15 text-orange-300 border-orange-400/20",
  curiosity: "bg-sky-500/15 text-sky-300 border-sky-400/20",
  proof: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  "fear-to-relief": "bg-pink-500/15 text-pink-300 border-pink-400/20",
};

const assetIcons: Record<string, typeof FileText> = {
  hook: Sparkles,
  reel_script: Clapperboard,
  ad: Megaphone,
  email: Mail,
  landing_page_section: FileText,
};

export default function NewCampaignPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "Instagram",
    "Email",
  ]);
  const [deduping, setDeduping] = useState(false);

const [dedupeReport, setDedupeReport] = useState<{
  checked: number;
  removed: number;
  threshold: number;
} | null>(null);
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [model, setModel] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setDocuments([]);
        setLoadingDocuments(false);
        router.replace("/login");
        return;
      }

      try {
        const docsQuery = query(
          collection(db, "brand_docs"),
          where("ownerId", "==", currentUser.uid),
        );

        const snapshot = await getDocs(docsQuery);

        const loadedDocuments: BrandDocument[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            filename:
              typeof data.filename === "string"
                ? data.filename
                : "Untitled brand document",
            
                rules: Array.isArray(data.rules)
  ? data.rules
      .map((rule: unknown): string | null => {
        if (typeof rule === "string") {
          return rule;
        }

        if (
          typeof rule === "object" &&
          rule !== null &&
          "text" in rule &&
          typeof rule.text === "string"
        ) {
          return rule.text;
        }

        return null;
      })
      .filter((rule): rule is string => rule !== null)
  : [],
            ruleCount:
              typeof data.ruleCount === "number"
                ? data.ruleCount
                : undefined,
            status:
              typeof data.status === "string" ? data.status : undefined,
          };
        });

        setDocuments(loadedDocuments);

        const firstProcessed = loadedDocuments.find(
          (document) =>
            document.status === "processed" && document.rules.length > 0,
        );

        if (firstProcessed) {
          setSelectedDocumentId(firstProcessed.id);
        }
      } catch (loadError) {
        console.error("Could not load brand documents:", loadError);
        setError(
          "We couldn't load your Brand Brain documents. Check your Firestore rules and try again.",
        );
      } finally {
        setLoadingDocuments(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  const selectedRules = selectedDocument?.rules ?? [];

  function toggleChannel(channel: string) {
    setSelectedChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  }

  async function generateCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setAssets([]);
    setCampaignId("");

    if (!user) {
      setError("Please sign in before generating a campaign.");
      return;
    }

    if (!selectedChannels.length) {
      setError("Select at least one marketing channel.");
      return;
    }

    if (!selectedDocument || !selectedRules.length) {
      setError(
        "Select a processed Brand Brain document containing extracted rules.",
      );
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,
          audience,
          goal,
          channels: selectedChannels,
          brandRules: selectedRules,
        }),
      });

      const result = (await response.json()) as GenerationResponse;

      if (!response.ok || !result.success || !result.assets?.length) {
        throw new Error(
          result.error || "The campaign could not be generated.",
        );
      }

      setAssets(result.assets);
      setModel(result.model ?? "OpenRouter");

      setNotice(
        `Generated ${result.assets.length} marketing assets using ${selectedDocument.filename}.`,
      );
    } catch (generationError) {
      console.error("Campaign generation failed:", generationError);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Campaign generation failed. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveCampaign() {
    if (!user || !selectedDocument || !assets.length) {
      setError("Generate assets before saving your campaign.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const campaignRef = await addDoc(collection(db, "campaigns"), {
        ownerId: user.uid,
        name: product.trim(),
        brief: {
          product: product.trim(),
          audience: audience.trim(),
          goal: goal.trim(),
          channels: selectedChannels,
        },
        brandDocumentId: selectedDocument.id,
        brandDocumentName: selectedDocument.filename,
        status: "generated",
        assetCount: assets.length,
        model,
        createdAt: serverTimestamp(),
      });

      const assetWrites = assets.map((asset) =>
        addDoc(collection(db, "assets"), {
          ownerId: user.uid,
          campaignId: campaignRef.id,
          type: asset.type,
          title: asset.title,
          content: asset.content,
          angle: asset.angle,
          channel: selectedChannels[0],
          brandDocumentId: selectedDocument.id,
          brandRuleIds: asset.brandRuleIds,
          brandRuleQuotes: asset.brandRuleQuotes,
          policyFlags: asset.policyFlags,
          complianceStatus: asset.complianceStatus,
          createdAt: serverTimestamp(),
        }),
      );

      await Promise.all(assetWrites);

      setCampaignId(campaignRef.id);
      setNotice(
        `Campaign and ${assets.length} assets saved successfully to Firestore.`,
      );
    } catch (saveError) {
      console.error("Could not save campaign:", saveError);
      setError(
        "The campaign was generated, but saving failed. Check your Firestore security rules for the campaigns and assets collections.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function runDeduplication() {
  if (!user || !campaignId || deduping) {
    setError("Save a campaign before running deduplication.");
    return;
  }

  setDeduping(true);
  setError("");
  setNotice("");
  setDedupeReport(null);

  try {
    const assetsQuery = query(
      collection(db, "assets"),
      where("ownerId", "==", user.uid),
      where("campaignId", "==", campaignId),
    );

    const snapshot = await getDocs(assetsQuery);

    const savedAssets = snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        type: String(data.type ?? ""),
        title: String(data.title ?? ""),
        content: String(data.content ?? ""),
      };
    });

    const result = deduplicateAssets(savedAssets, 0.82);

    if (result.removed.length > 0) {
      await Promise.all(
        result.removed.map((asset) =>
          deleteDoc(doc(db, "assets", asset.id)),
        ),
      );

      await updateDoc(doc(db, "campaigns", campaignId), {
        assetCount: result.kept.length,
        deduplication: {
          checked: savedAssets.length,
          removed: result.removed.length,
          threshold: result.threshold,
          completedAt: new Date().toISOString(),
        },
      });
    } else {
      await updateDoc(doc(db, "campaigns", campaignId), {
        deduplication: {
          checked: savedAssets.length,
          removed: 0,
          threshold: result.threshold,
          completedAt: new Date().toISOString(),
        },
      });
    }

    setDedupeReport({
      checked: savedAssets.length,
      removed: result.removed.length,
      threshold: result.threshold,
    });

    setNotice(
      result.removed.length > 0
        ? `Deduplication complete: removed ${result.removed.length} duplicate assets. ${result.kept.length} unique assets remain.`
        : `Deduplication complete: checked ${savedAssets.length} assets and found no duplicates.`,
    );
  } catch (dedupeError) {
    console.error("Deduplication failed:", dedupeError);

    setError(
      "Deduplication failed. Check your Firestore permissions and terminal logs.",
    );
  } finally {
    setDeduping(false);
  }
}

  if (!authReady || loadingDocuments) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090d] text-white">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-violet-400" />
        <span className="text-sm text-zinc-400">
          Loading your campaign workspace...
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090d] text-zinc-100">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              <WandSparkles className="h-3.5 w-3.5" />
              AI campaign studio
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Create a campaign
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Generate brand-aware marketing assets with traceable rules and
              automated compliance checks.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 md:self-auto">
            <BrainCircuit className="h-5 w-5 text-violet-300" />
            <div>
              <p className="text-sm font-medium">Brand Brain</p>
              <p className="text-xs text-zinc-500">
                {documents.length} document
                {documents.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="h-fit rounded-2xl border border-white/[0.09] bg-[#101016] p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                <Target className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h2 className="font-semibold">Campaign brief</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Tell the AI what you want to achieve.
                </p>
              </div>
            </div>

            <form onSubmit={generateCampaign} className="space-y-5">
              <div>
                <label
                  htmlFor="product"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Product or service
                </label>
                <input
                  id="product"
                  required
                  minLength={2}
                  maxLength={300}
                  value={product}
                  onChange={(event) => setProduct(event.target.value)}
                  placeholder="e.g. A productivity app for students"
                  className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60"
                />
              </div>

              <div>
                <label
                  htmlFor="audience"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Target audience
                </label>
                <textarea
                  id="audience"
                  required
                  minLength={2}
                  maxLength={500}
                  rows={3}
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Who are you trying to reach?"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60"
                />
              </div>

              <div>
                <label
                  htmlFor="goal"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Campaign goal
                </label>
                <textarea
                  id="goal"
                  required
                  minLength={2}
                  maxLength={500}
                  rows={2}
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="e.g. Increase free-trial signups"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Marketing channels
                </label>

                <div className="flex flex-wrap gap-2">
                  {channels.map((channel) => {
                    const active = selectedChannels.includes(channel);

                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleChannel(channel)}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {channel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="brandDocument"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Ground in Brand Brain
                </label>

                <div className="relative">
                  <select
                    id="brandDocument"
                    value={selectedDocumentId}
                    onChange={(event) =>
                      setSelectedDocumentId(event.target.value)
                    }
                    required
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 pr-10 text-sm outline-none focus:border-violet-400/60"
                  >
                    <option value="">Select a brand document</option>
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.filename}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                </div>

                {selectedDocument && (
                  <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-emerald-300">
                      <BadgeCheck className="h-4 w-4" />
                      {selectedRules.length} extracted rules available
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">
                      {selectedRules.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                )}

                {!documents.length && (
                  <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-200">
                    Upload and process a brand document in Brand Brain before
                    generating a campaign.
                    <button
                      type="button"
                      onClick={() => router.push("/brand-brain")}
                      className="ml-1 inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      Open Brand Brain <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-3 text-sm leading-5 text-red-300"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-3 text-sm leading-5 text-emerald-300"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={generating || !documents.length}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generating campaign...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate campaign
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-zinc-600">
                Generated copy is checked for selected risky phrases. Review
                all claims before publishing.
              </p>
            </form>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Generated assets</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Each asset includes a creative angle and brand-rule references.
                </p>
              </div>

              {assets.length > 0 && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
                  {assets.length} assets
                </span>
              )}
            </div>

            {!assets.length ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                  <WandSparkles className="h-7 w-7 text-violet-300" />
                </div>
                <h3 className="font-medium text-zinc-200">
                  Your next campaign starts here
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Complete the brief and generate five assets tailored to your
                  brand voice.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Hook", "Reel script", "Ad", "Email", "Landing page"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500"
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => {
                  const Icon = assetIcons[asset.type] ?? FileText;

                  return (
                    <article
                      key={asset.id}
                      className="rounded-2xl border border-white/[0.09] bg-[#101016] p-5 transition hover:border-white/[0.15] sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                            <Icon className="h-5 w-5 text-zinc-300" />
                          </div>
                          <div>
                            <h3 className="font-medium text-zinc-100">
                              {asset.title}
                            </h3>
                            <p className="mt-1 text-xs capitalize text-zinc-500">
                              {asset.type.replaceAll("_", " ")}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${angleStyles[asset.angle] ?? "border-white/10 text-zinc-300"}`}
                        >
                          {asset.angle}
                        </span>
                      </div>

                      <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                        {asset.content}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
                        {asset.complianceStatus === "rewritten" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Risky phrase rewritten
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Basic compliance check passed
                          </span>
                        )}

                        {asset.brandRuleIds.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-300">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {asset.brandRuleIds.length} brand rule
                            {asset.brandRuleIds.length === 1 ? "" : "s"} cited
                          </span>
                        )}
                      </div>

                      {asset.brandRuleIds.length > 0 && (
                        <details className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <summary className="cursor-pointer text-xs font-medium text-zinc-400">
                            View brand-rule references
                          </summary>
                          <div className="mt-3 space-y-2">
                            {asset.brandRuleIds.map((ruleId, index) => (
                              <div
                                key={`${asset.id}-rule-${ruleId}`}
                                className="rounded-lg border-l-2 border-violet-400/50 bg-white/[0.025] px-3 py-2"
                              >
                                <p className="text-[11px] text-violet-300">
                                  Brand rule #{ruleId}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-400">
                                  {asset.brandRuleQuotes[index] ??
                                    selectedRules[ruleId - 1] ??
                                    "Referenced brand rule"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {asset.policyFlags.length > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-400/15 bg-amber-500/[0.05] p-3 text-xs text-amber-300">
                          Policy flags: {asset.policyFlags.join(", ")}
                        </div>
                      )}
                    </article>
                  );
                })}

                <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.09] bg-[#101016] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Save this campaign</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Store the brief, assets, creative angles, and brand-rule
                      references in Firestore.
                    </p>
                    {campaignId && (
                      <p className="mt-2 break-all text-xs text-emerald-300">
                        Campaign ID: {campaignId}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={saveCampaign}
                      disabled={saving || Boolean(campaignId)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {campaignId
                        ? "Saved to Firestore"
                        : saving
                          ? "Saving..."
                          : "Save campaign"}
                    </button>

                    <button
                      type="button"
                      onClick={runDeduplication}
                      disabled={!campaignId || saving || deduping}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deduping ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {deduping ? "Checking duplicates..." : "Run deduplication"}
                    </button>
                  </div>
                </div>

                {dedupeReport && (
                  <p className="mt-3 text-xs text-emerald-300">
                    Checked {dedupeReport.checked} assets · Removed {dedupeReport.removed} duplicates · Similarity threshold {(dedupeReport.threshold * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {assets.length > 0 && model && (
              <p className="mt-4 text-right text-xs text-zinc-600">
                Generated with {model}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}