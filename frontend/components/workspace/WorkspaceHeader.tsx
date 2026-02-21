"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
      <Link
        href="/"
        className="text-lg font-semibold text-foreground hover:text-primary transition-all duration-200"
      >
        Perfora
      </Link>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className="relative size-9 text-muted-foreground hover:text-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {user && (
          <>
            <span className="text-sm text-muted-foreground truncate max-w-[180px]">
              {user.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              Sair
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
