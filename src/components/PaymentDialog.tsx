
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { completeReservation } from "@/actions/reservations";
import { useToast } from "@/hooks/use-toast";
import type { Table as TableType } from "@/app/[locale]/admin/tables/page";
import type { Timestamp } from "firebase/firestore";

type Reservation = {
  id: string;
  name: string;
  billAmount?: number;
  [key: string]: any; 
};

type PaymentDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  table: TableType;
  reservation: Reservation;
};

export function PaymentDialog({
  isOpen,
  setIsOpen,
  table,
  reservation,
}: PaymentDialogProps) {
  const t = useTranslations('PaymentDialog');
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!paymentMethod) return;
    setIsSubmitting(true);

    const result = await completeReservation(reservation.id, table.id, paymentMethod);
    
    if (result.success) {
        toast({
            title: t('toast.successTitle'),
            description: t('toast.successDescription'),
        });
    } else {
        toast({
            variant: 'destructive',
            title: t('toast.errorTitle'),
            description: result.error || t('toast.errorDescription'),
        });
    }
    
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('title', {tableName: table.name})}</DialogTitle>
          <DialogDescription>
            {t('description', {customerName: reservation.name})}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('billAmount')}</span>
                <span className="text-lg font-bold text-foreground">${reservation.billAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="space-y-2">
                <Label htmlFor="payment-method-select">{t('paymentMethod')}</Label>
                <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                    <SelectTrigger id="payment-method-select">
                        <SelectValue placeholder={t('selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">{t('cash')}</SelectItem>
                        <SelectItem value="Card">{t('card')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!paymentMethod || isSubmitting}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
