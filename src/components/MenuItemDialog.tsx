
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { MenuItem } from "@/lib/models";

export const MenuItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  category: z.string().min(3, "Category is required."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
});

type MenuItemDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (data: z.infer<typeof MenuItemSchema>) => void;
  item?: MenuItem;
};

export function MenuItemDialog({ isOpen, setIsOpen, onSave, item }: MenuItemDialogProps) {
  const t = useTranslations('AdminMenuPage.dialog');
  
  const form = useForm<z.infer<typeof MenuItemSchema>>({
    resolver: zodResolver(MenuItemSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset(item);
    } else {
      form.reset({ name: "", category: "", price: 0 });
    }
  }, [item, form, isOpen]);

  const handleSubmit = (values: z.infer<typeof MenuItemSchema>) => {
    onSave(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{item ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {item ? t('editDescription') : t('addDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="menu-item-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('categoryPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('price')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder={t('pricePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="menu-item-form">
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
