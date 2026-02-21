"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function WorkspaceHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-white/10 bg-surface flex items-center justify-between px-4 flex-shrink-0">
      <Link
        href="/"
        className="text-lg font-semibold text-text hover:text-primary transition-colors"
      >
        Perfora
      </Link>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-muted truncate max-w-[180px]">
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-muted hover:text-text transition-colors"
            >
              Sair
            </button>
          </>
        )}
      </div>
    </header>
  );
}
