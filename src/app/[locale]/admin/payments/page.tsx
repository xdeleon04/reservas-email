
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, CreditCard, DollarSign } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import type { Table as TableType } from "../tables/page";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PaymentDialog } from "@/components/PaymentDialog";

export type PayableItem = {
    table: TableType;
    customerName: string;
    billAmount: number;
    reservationId?: string;
};

export default function AdminPaymentPage() {
  const t = useTranslations("AdminPaymentPage");
  const tCard = useTranslations("AdminTablePage.tableCard");
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PayableItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if user is not authorized
  useEffect(() => {
    if (!isAuthLoading && user && !user.isAdmin && !user.isCashier) {
      router.replace("/admin/tables");
    }
  }, [user, isAuthLoading, router]);

  // Fetch occupied tables (this is the only data fetch needed now)
  useEffect(() => {
    if (user?.isAdmin || user?.isCashier) {
      const q = query(
        collection(db, "tables"),
        where("status", "==", "Occupied"),
        orderBy("name")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tablesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as TableType)
        );
        setTables(tablesData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching occupied tables: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        if (!isAuthLoading) setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  const payableItems = useMemo<PayableItem[]>(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    
    // All data is now on the table objects, so no need to fetch reservations
    const allItems: PayableItem[] = tables
        .filter(table => table.status === 'Occupied' && table.customerName && typeof table.billAmount === 'number')
        .map(table => ({
            table,
            customerName: table.customerName!,
            billAmount: table.billAmount!,
            reservationId: table.reservationId,
        }));
    
    return allItems.filter(item => 
        item.table.name.toLowerCase().includes(lowercasedQuery) ||
        item.customerName.toLowerCase().includes(lowercasedQuery)
    );
  }, [tables, searchQuery]);


  const handleProcessPaymentClick = (item: PayableItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  if (isLoading || isAuthLoading || (user && !user.isAdmin && !user.isCashier)) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {payableItems.length === 0 ? (
            <p className="text-center p-8 text-muted-foreground">
              {t("noOccupiedTables")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {payableItems.map((item) => (
                <Card key={item.table.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{item.table.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2 text-muted-foreground">
                    <p className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {item.customerName}
                    </p>
                    <p className="flex items-center font-medium text-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      {t('billAmount', {amount: item.billAmount.toFixed(2)})}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => handleProcessPaymentClick(item)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('processPayment')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedItem && (
        <PaymentDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            item={selectedItem}
        />
      )}
    </>
  );
}
