
"use client";

import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  PlusCircle,
  Loader2,
  Brush,
  Sparkles,
  User,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { TableDialog, TableSchema } from "@/components/TableDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export type Table = z.infer<typeof TableSchema> & { id: string };
type Reservation = {
  id: string;
  name: string;
  status: "Confirmed" | "Seated";
  assignedTableId: string;
};

export default function AdminTablePage() {
  const t = useTranslations("AdminTablePage");
  const tStatus = useTranslations("Statuses");
  const tCard = useTranslations("AdminTablePage.tableCard");
  const { user } = useAuth();

  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(
    undefined
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  useEffect(() => {
    const q = query(collection(db, "tables"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tablesData: Table[] = [];
      querySnapshot.forEach((doc) => {
        tablesData.push({ id: doc.id, ...doc.data() } as Table);
      });
      setTables(tablesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "reservations"),
      where("status", "in", ["Confirmed", "Seated"])
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const resData: Reservation[] = [];
      querySnapshot.forEach((doc) => {
        resData.push({ id: doc.id, ...doc.data() } as Reservation);
      });
      setReservations(resData);
    });
    return () => unsubscribe();
  }, []);

  const reservationsByTableId = useMemo(() => {
    return reservations.reduce((acc, res) => {
      if (res.assignedTableId) {
        acc[res.assignedTableId] = res;
      }
      return acc;
    }, {} as Record<string, Reservation>);
  }, [reservations]);

  const handleAdd = () => {
    setEditingTable(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (table: Table) => {
    setTableToDelete(table);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (tableToDelete) {
      await deleteDoc(doc(db, "tables", tableToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setTableToDelete(null);
  };

  const handleSave = async (tableData: z.infer<typeof TableSchema>) => {
    if (editingTable) {
      const tableRef = doc(db, "tables", editingTable.id);
      await updateDoc(tableRef, tableData);
    } else {
      await addDoc(collection(db, "tables"), tableData);
    }
  };

  const handleUpdateStatus = async (
    table: Table,
    status: Table["status"]
  ) => {
    const tableRef = doc(db, "tables", table.id);
    await updateDoc(tableRef, { status });
  };

  const statusVariant = {
    Available: "outline",
    Occupied: "default",
    Reserved: "secondary",
    Cleaning: "destructive",
  } as const;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </div>
          {user?.isAdmin && (
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addTable")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {tables.length === 0 ? (
                 <p className="text-center p-8 text-muted-foreground">{t('noTables')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tables.map((table) => {
                    const reservation = reservationsByTableId[table.id];
                    return (
                      <Card key={table.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{table.name}</span>
                            <Badge variant={statusVariant[table.status]}>
                              {tStatus(table.status)}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {tCard("capacity", { capacity: table.capacity })}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="mr-2 h-4 w-4" />
                            {reservation ? (
                                <span>{reservation.name}</span>
                            ) : (
                                <span>{tCard('noCustomer')}</span>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-stretch gap-2">
                          {/* Waiter Actions */}
                          {user?.isWaiter && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus(table, "Cleaning")}
                                disabled={table.status !== "Occupied"}
                              >
                                <Brush className="mr-2" /> {t("actions.markCleaning")}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus(table, "Available")}
                                disabled={table.status !== "Cleaning"}
                              >
                                <Sparkles className="mr-2" /> {t("actions.markAvailable")}
                              </Button>
                            </>
                          )}

                          {/* Receptionist Actions */}
                           {user?.isReceptionist && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(true)}
                                disabled={table.status === 'Available' || table.status === 'Cleaning'}
                              >
                                <Brush className="mr-2" /> {t("actions.markCleaning")}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus(table, 'Available')}
                                disabled={table.status !== 'Cleaning' && table.status !== 'Completed' && table.status !== 'Occupied'}
                              >
                                <Sparkles className="mr-2" /> {t("actions.markAvailable")}
                              </Button>
                            </>
                          )}

                          {/* Admin Actions */}
                          {user?.isAdmin && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEdit(table)}
                                    className="flex-grow"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteClick(table)}
                                    className="flex-grow"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TableDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSave={handleSave}
        table={editingTable}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: tableToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTableToDelete(null)}>
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
