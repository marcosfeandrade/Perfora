"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
  if (loading && !user && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted">Carregando…</div>
      </div>
    );
  }

  return <>{children}</>;
}
