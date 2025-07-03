
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function AdminSkeleton() {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mb-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const activeTab = pathname.startsWith("/admin/tables") ? "tables" : "reservations";

  useEffect(() => {
    if (!isLoading && (!user || user.isAnonymous)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.isAnonymous) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto">
                <AdminSkeleton />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-6">
            <h1 className="text-3xl font-headline font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your restaurant's reservations and tables.</p>
        </div>
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="reservations" asChild>
              <Link href="/admin">Reservations</Link>
            </TabsTrigger>
            <TabsTrigger value="tables" asChild>
              <Link href="/admin/tables">Tables</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
