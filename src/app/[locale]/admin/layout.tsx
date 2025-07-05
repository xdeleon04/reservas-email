
"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("AdminLayout");
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const isStaff = user && (user.isAdmin || user.isReceptionist || user.isWaiter || user.isCashier);
  
  let activeTab = "tables";
  if (pathname.startsWith("/admin/users")) activeTab = "users";
  else if (pathname.startsWith("/admin/payments")) activeTab = "payments";
  else if (pathname.startsWith("/admin") && (pathname.length === 6 || pathname.endsWith('/admin/'))) activeTab = "reservations";

  useEffect(() => {
    if (!isLoading && !isStaff) {
      router.push('/login');
    }
  }, [user, isLoading, router, isStaff]);

  const availableTabs = useMemo(() => {
    if (!user) return [];
    return [
      (user.isAdmin || user.isReceptionist) && { value: "reservations", href: "/admin", label: t('reservations') },
      (user.isAdmin || user.isReceptionist || user.isWaiter || user.isCashier) && { value: "tables", href: "/admin/tables", label: t('tables') },
      (user.isAdmin || user.isCashier) && { value: "payments", href: "/admin/payments", label: t('payments') },
      user.isAdmin && { value: "users", href: "/admin/users", label: t('users') }
    ].filter(Boolean) as { value: string; href: string; label: string }[];
  }, [user, t]);


  if (isLoading || !isStaff) {
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
            <h1 className="text-3xl font-headline font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-xl grid-flow-col auto-cols-fr">
            {availableTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} asChild>
                <Link href={tab.href}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
