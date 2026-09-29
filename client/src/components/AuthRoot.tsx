import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase, usesSupabase } from "../supabase";
import { PasswordField } from "./PasswordField";

type AuthRootProps = {
  children: (account: { email: string; signOut: () => Promise<void> } | null) => ReactNode;
};

export function AuthRoot({ children }: AuthRootProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(usesSupabase);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!usesSupabase || !supabase) return;
    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        setSession(data.session);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Could not open your account. Please try again.");
      })
      .finally(() => setIsLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!usesSupabase) return children(null);

  if (!isSupabaseConfigured || !supabase) {
    return <div className="grid min-h-[100dvh] place-items-center bg-[#F4F4F2] p-6"><div className="max-w-lg rounded-xl border border-red-200 bg-white p-6 text-red-700 shadow-xl"><h1 className="text-xl font-bold">Cloud storage is not configured</h1><p className="mt-2 text-sm leading-6">Add the Supabase project URL and publishable key to the deployment environment.</p></div></div>;
  }
  const authClient = supabase;

  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-[#F4F4F2] text-sm font-semibold text-[#686868]">Opening your private workspace...</div>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const confirmationUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
      const result = isSignUp
        ? await authClient.auth.signUp({ email, password, options: { emailRedirectTo: confirmationUrl } })
        : await authClient.auth.signInWithPassword({ email, password });
      if (result.error) setError(result.error.message);
      else if (isSignUp && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not connect to your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    return (
      <main className="grid min-h-[100dvh] bg-[#3D3F40] p-5 sm:place-items-center sm:p-8">
        <section className="w-full max-w-md self-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.3)]">
          <div className="h-2 bg-[#F5822A]" />
          <div className="p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#F5822A] text-xl font-bold text-[#202020]">i</span>
              <div><p className="text-xl font-bold text-[#202020]">i-Prep</p><p className="text-xs uppercase tracking-[0.14em] text-[#686868]">Private interview archive</p></div>
            </div>
            <h1 className="mt-8 text-3xl font-bold text-[#202020]">{isSignUp ? "Create your private account" : "Welcome back"}</h1>
            <p className="mt-2 text-sm leading-6 text-[#686868]">{isSignUp ? "Your interviews, questions, and answers will belong only to your account." : "Sign in to continue your interview preparation."}</p>
            {error && <p className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            {message && <p className="mt-5 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
            <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>
              <label className="grid gap-1.5 text-sm font-bold text-[#303030]">Email<input autoComplete="email" className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <PasswordField autoComplete={isSignUp ? "new-password" : "current-password"} label="Password" value={password} onChange={setPassword} />
              {isSignUp && <PasswordField autoComplete="new-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />}
              <button className="mt-2 rounded-md bg-[#F5822A] px-4 py-3 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}</button>
            </form>
            <button className="mt-5 w-full text-sm font-bold text-[#C95712] hover:text-[#9A3D00]" type="button" onClick={() => { setIsSignUp((current) => !current); setEmail(""); setPassword(""); setConfirmPassword(""); setError(""); setMessage(""); }}>{isSignUp ? "Already have an account? Sign in" : "New to i-Prep? Create an account"}</button>
          </div>
        </section>
      </main>
    );
  }

  return children({
    email: session.user.email ?? "Account",
    signOut: async () => {
      const { error: signOutError } = await authClient.auth.signOut();
      if (signOutError) throw signOutError;
    },
  });
}
