
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Reserve" },
    { href: "/review", label: "Review" },
    { href: "/admin", label: "Admin" },
  ];

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "transition-colors",
        pathname === href
          ? "text-primary font-bold"
          : "text-muted-foreground"
      )}
      onClick={() => setIsSheetOpen(false)}
    >
      <Link href={href}>{label}</Link>
    </Button>
  );

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold font-headline text-primary"
          onClick={() => setIsSheetOpen(false)}
        >
          <Utensils className="h-7 w-7" />
          <span>Reservas Email</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <div className="flex justify-between items-center mb-8">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-bold font-headline text-primary"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <Utensils className="h-6 w-6" />
                  <span>Reservas Email</span>
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col items-start gap-4">
                {navLinks.map((link) => (
                  <NavLink key={link.href} {...link} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
