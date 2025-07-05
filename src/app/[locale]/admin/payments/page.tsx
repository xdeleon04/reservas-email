
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
  Timestamp,
  orderBy,
  documentId,
} from "firebase/firestore";
import type { Table as TableType } from "../tables/page";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PaymentDialog } from "@/components/PaymentDialog";

type Reservation = {
  id: string;
  name: string;
  email: string;
  guests: number;
  reservationTime: Timestamp;
  createdAt: Timestamp;
  status: "Pending" | "Confirmed" | "Seated" | "Completed" | "Cancelled";
  assignedTableId?: string;
  assignedTableName?: string;
  billAmount?: number;
};

export type PayableItem = {
    table: TableType;
    customerName: string;
    billAmount: number;
    reservationId?: string;
    reservation?: Reservation;
};

export default function AdminPaymentPage() {
  const t = useTranslations("AdminPaymentPage");
  const tCard = useTranslations("AdminTablePage.tableCard");
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [tables, setTables] = useState<TableType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

  // Fetch occupied tables
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
      }, (error) => {
        console.error("Error fetching occupied tables: ", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Fetch reservations for the occupied tables
  useEffect(() => {
    const reservationIds = tables
      .map((t) => t.reservationId)
      .filter((id): id is string => !!id);

    if (reservationIds.length === 0) {
      setReservations([]);
      // Don't set loading to false here, wait for walk-ins to be processed
      return;
    }

    const q = query(
      collection(db, "reservations"),
      where(documentId(), "in", reservationIds),
      where("status", "==", "Seated")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reservation)
      );
      setReservations(resData);
    }, (error) => {
      console.error("Error fetching reservations for tables: ", error);
    });
    return () => unsubscribe();
  }, [tables]);

  // Combined effect to set loading state
  useEffect(() => {
      if (user?.isAdmin || user?.isCashier) {
          // This effect determines the overall loading state.
          // It relies on `tables` being fetched first.
          setIsLoading(false);
      }
  }, [tables, user]);

  const payableItems = useMemo<PayableItem[]>(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    
    // Process tables with reservations
    const itemsFromReservations = tables
        .filter(table => !!table.reservationId)
        .map((table) => {
            const reservation = reservations.find(
                (res) => res.id === table.reservationId && res.status === 'Seated'
            );
            return reservation ? { 
                table, 
                customerName: reservation.name,
                billAmount: reservation.billAmount || 0,
                reservationId: reservation.id,
                reservation: reservation,
            } : null;
        })
        .filter((item): item is NonNullable<typeof item> => !!item);

    // Process walk-in tables
    const itemsFromWalkIns = tables
        .filter(table => !table.reservationId && table.status === 'Occupied')
        .map(table => ({
            table,
            customerName: table.customerName || tCard('walkInCustomer'),
            billAmount: table.billAmount || 0,
        }));

    const allItems = [...itemsFromReservations, ...itemsFromWalkIns];
    
    return allItems.filter(item => 
        item.table.name.toLowerCase().includes(lowercasedQuery) ||
        item.customerName.toLowerCase().includes(lowercasedQuery)
    );
  }, [tables, reservations, searchQuery, tCard]);


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
