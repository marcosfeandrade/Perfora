"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text mb-6 text-center">
          Criar conta no Perfora
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 rounded-xl bg-surface border border-white/10"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-muted mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm text-muted mb-1"
            >
              Nome (opcional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-muted mb-1"
            >
              Senha (mínimo 6 caracteres)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cadastrando…" : "Cadastrar"}
          </button>
          <p className="text-center text-sm text-muted">
            Já tem conta?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
