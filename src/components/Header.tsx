"use client";

import { Button } from "@/components/ui/button";
import { Utensils, Menu, LogOut, Globe } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, logout } = useAuth();

  const navLinks = [
    { href: "/", label: t('reserve') },
    { href: "/review", label: t('review') },
    { href: "/admin", label: t('admin') },
  ];

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
    setIsSheetOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    setIsSheetOpen(false);
  };

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
        <Button
        variant="ghost"
        asChild
        className={cn(
            "transition-colors",
            isActive ? "text-primary font-bold" : "text-muted-foreground"
        )}
        onClick={() => setIsSheetOpen(false)}
        >
        <Link href={href}>{label}</Link>
        </Button>
    )
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold font-headline text-primary"
          onClick={() => setIsSheetOpen(false)}
        >
          <Utensils className="h-7 w-7" />
          <span>{t('title')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t('language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleLocaleChange('en')} disabled={locale === 'en'}>
                {t('english')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLocaleChange('es')} disabled={locale === 'es'}>
                {t('spanish')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && !user.isAnonymous && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t('logout')}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">{t('logout')}</span>
            </Button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <SheetHeader>
                <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
              </SheetHeader>
              <div className="flex justify-between items-center mb-8">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-bold font-headline text-primary"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <Utensils className="h-6 w-6" />
                  <span>{t('title')}</span>
                </Link>
              </div>
              <nav className="flex flex-col items-start gap-4">
                {navLinks.map((link) => (
                  <NavLink key={link.href} {...link} />
                ))}
                 {user && !user.isAnonymous && (
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('logout')}
                    </Button>
                )}
                <div className="pt-4 w-full">
                    <p className="text-sm text-muted-foreground px-4 pb-2">{t('language')}</p>
                    <Button variant={locale === 'en' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleLocaleChange('en')}>{t('english')}</Button>
                    <Button variant={locale === 'es' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleLocaleChange('es')}>{t('spanish')}</Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
