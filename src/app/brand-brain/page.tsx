"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

type BrandRule = {
  id: string;
  text: string;
  category: string;
};

type BrandDocument = {
  id: string;
  filename: string;
  pageCount: number;
  characterCount: number;
  ruleCount: number;
  rules: BrandRule[];
  status: string;
  createdAt?: {
    toDate?: () => Date;
  } | null;
};

type ProcessedDocument = {
  success: boolean;
  filename: string;
  pageCount: number;
  characterCount: number;
  extractedText: string;
  rules: BrandRule[];
  ruleCount: number;
  error?: string;
};

export default function BrandBrainPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<ProcessedDocument | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }

    const documentsQuery = query(
  collection(db, "brand_docs"),
  where("ownerId", "==", user.uid),
);

const unsubscribe = onSnapshot(
  documentsQuery,
  (snapshot) => {
    const userDocuments = snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }) as BrandDocument)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() ?? 0;

        return dateB - dateA;
      });

    setDocuments(userDocuments);
  },
      (snapshotError) => {
        console.error("Failed to load brand documents:", snapshotError);
        setError(
          "Unable to load saved documents. Check your Firestore security rules.",
        );
      },
    );

    return unsubscribe;
  }, [user]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setError("");
    setSuccess("");
    setPreview(null);
  }

  async function handleUpload() {
    if (!user) {
      setError("Please sign in before uploading a brand document.");
      return;
    }

    if (!selectedFile) {
      setError("Select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/brand-documents", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as ProcessedDocument;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "PDF processing failed.");
      }

      setPreview(result);

      const documentReference = await addDoc(collection(db, "brand_docs"), {
        ownerId: user.uid,
        filename: result.filename,
        pageCount: result.pageCount,
        characterCount: result.characterCount,
        extractedText: result.extractedText,
        rules: result.rules,
        ruleCount: result.ruleCount,
        status: "processed",
        processingMethod: "keyword-based-extraction",
        createdAt: serverTimestamp(),
      });

      setSuccess(
        `Document processed and saved successfully. Document ID: ${documentReference.id}`,
      );

      setSelectedFile(null);

      const fileInput = document.getElementById(
        "brand-pdf",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (uploadError) {
      console.error("Brand Brain upload failed:", uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setProcessing(false);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-gray-300">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#08090d] px-6 text-center text-white">
        <BookOpen className="mb-4 h-10 w-10 text-violet-400" />

        <h1 className="text-2xl font-semibold">Sign in to use Brand Brain</h1>

        <p className="mt-3 max-w-md text-gray-400">
          Your brand documents are associated with your authenticated account.
        </p>

        <Link
          href="/login"
          className="mt-6 rounded-lg bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500"
        >
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <header className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
            <BookOpen className="h-6 w-6" />
          </div>

          <p className="text-sm font-medium text-violet-400">
            ORBITMARKETER KNOWLEDGE ENGINE
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Brand Brain
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-gray-400">
            Upload your brand guidelines, extract candidate rules, and save
            your brand knowledge for future campaign generation.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#101117] p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
              <Upload className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Upload brand guidelines
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Choose a text-based PDF of up to 10 MB. Its text will be
                extracted and candidate rules will be identified.
              </p>
            </div>
          </div>

          <label
            htmlFor="brand-pdf"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 px-5 py-10 text-center transition hover:border-violet-400/70"
          >
            <FileText className="mb-4 h-9 w-9 text-violet-300" />

            <span className="font-medium">
              {selectedFile ? selectedFile.name : "Choose a PDF document"}
            </span>

            <span className="mt-2 text-sm text-gray-500">
              {selectedFile
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                : "PDF format · Maximum 10 MB"}
            </span>

            <input
              id="brand-pdf"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Upload requires an authenticated session.
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || processing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-medium transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {processing ? "Processing PDF..." : "Process and save"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-5 flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
          )}
        </section>

        {preview && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#101117] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-400">
                  Extraction completed
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {preview.filename}
                </h2>
              </div>

              <span className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-300">
                {preview.ruleCount} candidate rules
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Metric label="PDF pages" value={preview.pageCount} />
              <Metric
                label="Characters extracted"
                value={preview.characterCount.toLocaleString()}
              />
              <Metric label="Candidate rules" value={preview.ruleCount} />
            </div>

            <h3 className="mb-4 mt-8 text-lg font-semibold">
              Extracted candidate rules
            </h3>

            {preview.rules.length === 0 ? (
              <p className="rounded-lg bg-black/20 p-4 text-sm text-gray-400">
                Text was extracted, but no candidate rules matched the current
                keyword-based filter. Review the original document or refine
                the extraction logic.
              </p>
            ) : (
              <div className="space-y-3">
                {preview.rules.map((rule) => (
                  <article
                    key={rule.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <span className="text-xs font-medium text-violet-300">
                      {rule.category}
                    </span>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {rule.text}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <details className="mt-6 rounded-lg border border-white/10 p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-300">
                View extracted document text
              </summary>

              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-gray-400">
                {preview.extractedText}
              </pre>
            </details>

            <p className="mt-5 text-xs leading-5 text-amber-300/80">
              Candidate rules are extracted using keywords and simple text
              patterns. Review them before relying on them for campaign
              decisions.
            </p>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101117] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Saved brand documents</h2>

              <p className="mt-2 text-sm text-gray-400">
                Documents associated with your account in Firestore.
              </p>
            </div>

            <span className="rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300">
              {documents.length} documents
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-600" />

              <p className="font-medium text-gray-300">
                No saved documents yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Process your first brand-guidelines PDF to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium">{document.filename}</p>

                      <p className="mt-1 text-sm text-gray-500">
                        {document.pageCount} pages ·{" "}
                        {document.ruleCount} candidate rules
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {document.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}