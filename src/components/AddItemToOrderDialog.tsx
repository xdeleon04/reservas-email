
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import type { Order, MenuItem } from "@/lib/models";
import { addItemToOrder } from "@/actions/orders";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { PlusCircle, Search, Loader2 } from "lucide-react";

type AddItemToOrderDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order;
  menuItems: MenuItem[];
};

export function AddItemToOrderDialog({
  isOpen,
  setIsOpen,
  order,
  menuItems,
}: AddItemToOrderDialogProps) {
  const t = useTranslations("AddItemDialog");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const itemsByCategory = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.category.toLowerCase().includes(lowercasedQuery)
    );

    return filtered.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [searchQuery, menuItems]);

  const handleAddItem = async (menuItem: MenuItem) => {
    setIsAdding(menuItem.id);
    // Create a plain object to pass to the server action
    const plainMenuItem: MenuItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category
    };

    const result = await addItemToOrder(order.id, plainMenuItem, 1);
    if (result.success) {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.successDescription", {
          itemName: menuItem.name,
          orderName: order.tableName,
        }),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("toast.errorTitle"),
        description: result.error,
      });
    }
    setIsAdding(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { tableName: order.tableName })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4">
            {Object.keys(itemsByCategory).length > 0 ? (
              Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold tracking-tight mb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddItem(item)}
                          disabled={!!isAdding}
                          className="w-[70px]"
                        >
                          {isAdding === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t("add")}
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">
                {t("noResults")}
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
