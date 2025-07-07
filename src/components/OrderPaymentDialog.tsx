
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
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { processPayment } from "@/actions/orders";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderItem } from "@/lib/models";

type OrderPaymentDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order;
};

export function OrderPaymentDialog({
  isOpen,
  setIsOpen,
  order,
}: OrderPaymentDialogProps) {
  const t = useTranslations('PaymentDialog');
  const { toast } = useToast();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unpaidItems = useMemo(() => order.items.filter(item => !item.paid), [order.items]);

  const paymentAmount = useMemo(() => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    return unpaidItems
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [customAmount, selectedItemIds, unpaidItems]);
  
  const remainingBalance = order.total - order.amountPaid;

  useEffect(() => {
    // When dialog opens, reset state
    if (isOpen) {
        setSelectedItemIds([]);
        setCustomAmount("");
        setPaymentMethod("");
    }
  }, [isOpen]);

  const handleItemSelect = (itemId: string) => {
    setCustomAmount(""); // Clear custom amount when items are selected
    setSelectedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const handleSelectAllUnpaid = () => {
    setCustomAmount("");
    setSelectedItemIds(unpaidItems.map(item => item.id));
  };
  
  const handlePayRemainingBalance = () => {
    setSelectedItemIds([]);
    setCustomAmount(remainingBalance.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!paymentMethod || paymentAmount <= 0) return;
    setIsSubmitting(true);

    const result = await processPayment(order.id, order.tableId, {
        amount: paymentAmount,
        method: paymentMethod,
        paidItemIds: selectedItemIds
    });
    
    if (result.success) {
        toast({
            title: t('toast.successTitle'),
            description: t('toast.successDescription'),
        });
        setIsOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: t('toast.errorTitle'),
            description: result.error || t('toast.errorDescription'),
        });
    }
    
    setIsSubmitting(false);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('title', {tableName: order.tableName})}</DialogTitle>
          <DialogDescription>
            {t('description', {customerName: order.customerName || 'Walk-in'})}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="font-semibold">Items</div>
            <div className="space-y-2">
                {unpaidItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                        <Checkbox 
                            id={`item-${item.id}`} 
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={() => handleItemSelect(item.id)}
                        />
                        <label htmlFor={`item-${item.id}`} className="flex-grow text-sm">
                            {item.quantity}x {item.name}
                        </label>
                        <span className="text-sm font-mono">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                ))}
                {unpaidItems.length === 0 && <p className="text-sm text-muted-foreground">All items paid.</p>}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllUnpaid} disabled={unpaidItems.length === 0}>Select All Unpaid</Button>
                <Button variant="outline" size="sm" onClick={handlePayRemainingBalance} disabled={remainingBalance <= 0}>Pay Full Balance</Button>
            </div>
            <div className="space-y-2">
                <Label htmlFor="custom-amount">Custom Payment Amount</Label>
                <Input 
                    id="custom-amount" 
                    type="number" 
                    placeholder="e.g. 20.50" 
                    value={customAmount}
                    onChange={(e) => {
                        setSelectedItemIds([]);
                        setCustomAmount(e.target.value);
                    }}
                />
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
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between font-medium text-lg">
                    <span>Total To Pay:</span>
                    <span>{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Remaining Balance:</span>
                    <span>{formatCurrency(remainingBalance - paymentAmount)}</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !paymentMethod || paymentAmount <= 0}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
