import "./globals.css";
import { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Perfora",
  description: "Perfora is a platform for creating and managing your projects",
  openGraph: {
    title: "Perfora",
    description: "Perfora is a platform for creating and managing your projects",
    images: [
      {
        url: "https://perfora.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Perfora",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
