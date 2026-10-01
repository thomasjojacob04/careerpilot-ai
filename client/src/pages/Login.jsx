import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/client";
import { Button, ErrorBox, Field, Input } from "../components/ui";

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-side p-10 text-white md:flex">
        <p className="text-xl font-extrabold tracking-tight">CareerPilot AI</p>
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Practise the interview before it counts.</h2>
          <p className="mt-4 max-w-md text-white/70">
            Build your profile, fix your resume, close skill gaps, and sit a proctored voice interview that scores you the way a recruiter would.
          </p>
        </div>
        <p className="text-sm text-white/50">For students and placement cells.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const user = await login(form.email, form.password);
      nav(user.role === "officer" ? "/officer" : "/dashboard");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><Input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorBox>{error}</ErrorBox>
        <Button className="w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        New here? <Link to="/register" className="font-semibold text-brand">Create an account</Link>
      </p>
    </AuthShell>
  );
}
