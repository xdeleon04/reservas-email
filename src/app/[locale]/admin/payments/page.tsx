
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
import { Loader2, Search, User, CreditCard, PlusCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { OrderPaymentDialog } from "@/components/OrderPaymentDialog";
import { Order, MenuItem } from "@/lib/models";
import { addItemToOrder } from "@/actions/orders";
import { useToast } from "@/hooks/use-toast";

export default function AdminPaymentPage() {
  const t = useTranslations("AdminPaymentPage");
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if user is not authorized
  useEffect(() => {
    if (!isAuthLoading && user && !user.isAdmin && !user.isCashier && !user.isReceptionist) {
      router.replace("/admin/tables");
    }
  }, [user, isAuthLoading, router]);

  // Fetch all open orders
  useEffect(() => {
    if (user?.role) {
      const q = query(
        collection(db, "orders"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Order)
        );
        setOrders(ordersData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching open orders: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        if (!isAuthLoading) setIsLoading(false);
    }
  }, [user, isAuthLoading]);
  
  // Fetch all menu items for adding to an order
  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("category"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo<Order[]>(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return orders;
    
    return orders.filter(order => 
        order.tableName.toLowerCase().includes(lowercasedQuery) ||
        (order.customerName && order.customerName.toLowerCase().includes(lowercasedQuery))
    );
  }, [orders, searchQuery]);

  const handleOpenPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleAddItem = async (orderId: string) => {
    // For simplicity, we add a random menu item. A real UI would have a selection dialog.
    if (menuItems.length === 0) {
        toast({ variant: 'destructive', title: "No Menu Items", description: "Please add items to the menu first."});
        return;
    }
    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    
    // Create a plain object to avoid serialization issues with Firestore Timestamps
    const plainMenuItem: MenuItem = {
        id: randomItem.id,
        name: randomItem.name,
        price: randomItem.price,
        category: randomItem.category
    };

    const result = await addItemToOrder(orderId, plainMenuItem, 1);
    if(result.success) {
        toast({ title: "Item Added", description: `Added ${randomItem.name} to the order.`});
    } else {
        toast({ variant: 'destructive', title: "Error", description: result.error});
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  if (isLoading || isAuthLoading) {
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
          {filteredOrders.length === 0 ? (
            <p className="text-center p-8 text-muted-foreground">
              {t("noOccupiedTables")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{order.tableName}</CardTitle>
                     <CardDescription className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {order.customerName || "Walk-in"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                     <div className="font-medium">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                     </div>
                     <div className="text-muted-foreground text-sm">
                        {formatCurrency(order.amountPaid)} paid of {formatCurrency(order.total)}
                     </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                     <Button className="w-full" onClick={() => handleOpenPaymentDialog(order)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('processPayment')}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleAddItem(order.id)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderPaymentDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            order={selectedOrder}
        />
      )}
    </>
  );
}
