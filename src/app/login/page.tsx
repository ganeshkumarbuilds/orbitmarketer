"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        const trimmedName = name.trim();

        if (!trimmedName) {
          throw new Error("Please enter your name.");
        }

        if (password.length < 6) {
          throw new Error("Your password must contain at least 6 characters.");
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          name: trimmedName,
          email: credential.user.email,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      const friendlyMessages: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/weak-password": "Choose a stronger password.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
        "auth/too-many-requests":
          "Too many attempts. Please try again later.",
        "Missing or insufficient permissions.":
          "Firestore denied access. Check your Firestore security rules.",
      };

      setError(
        friendlyMessages[message] ??
          (message.startsWith("auth/")
            ? "Authentication failed. Please check your Firebase settings."
            : message),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <a href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold">
            O
          </span>

          <span className="text-xl font-semibold tracking-tight">
            OrbitMarketer
          </span>
        </a>

        <section className="rounded-2xl border border-white/10 bg-[#101117] p-7 shadow-2xl sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-sm font-medium text-violet-400">
              Your campaign workspace
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              {isRegistering ? "Create your account" : "Welcome back"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              {isRegistering
                ? "Create an account to start building brand-consistent campaigns."
                : "Sign in to continue to your OrbitMarketer workspace."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#090a0f] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-gray-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-white/10 bg-[#090a0f] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete={
                  isRegistering ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                className="w-full rounded-lg border border-white/10 bg-[#090a0f] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="font-medium text-violet-400 hover:text-violet-300"
            >
              {isRegistering ? "Sign in" : "Create one"}
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-600">
          OrbitMarketer · Brand-consistent campaign engine
        </p>
      </div>
    </main>
  );
}