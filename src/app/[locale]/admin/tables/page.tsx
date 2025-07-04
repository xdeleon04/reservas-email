
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
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { TableDialog, TableSchema } from "@/components/TableDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { 
    markTableAsCleaning, 
    markTableAsAvailable, 
    markTableAsOccupied 
} from "@/actions/tables";

export type Table = z.infer<typeof TableSchema> & {
  id: string;
  customerName?: string;
  reservationId?: string;
};

export default function AdminTablePage() {
  const t = useTranslations("AdminTablePage");
  const tStatus = useTranslations("Statuses");
  const tCard = useTranslations("AdminTablePage.tableCard");
  const { user } = useAuth();

  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(
    undefined
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  useEffect(() => {
    const q = query(collection(db, "tables"), orderBy("name"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tablesData: Table[] = [];
        querySnapshot.forEach((doc) => {
          tablesData.push({ id: doc.id, ...doc.data() } as Table);
        });
        setTables(tablesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching tables:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = tables.filter(table =>
        table.name.toLowerCase().includes(lowercasedQuery) ||
        (table.customerName && table.customerName.toLowerCase().includes(lowercasedQuery))
    );
    setFilteredTables(filtered);
  }, [searchQuery, tables]);

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
    // This function is only for admins, via the dialog.
    if (editingTable) {
      const tableRef = doc(db, "tables", editingTable.id);
      await updateDoc(tableRef, tableData);
    } else {
      await addDoc(collection(db, "tables"), tableData);
    }
  };
  
  // Action handlers that call secure server actions
  const handleMarkCleaning = async (table: Table) => {
    await markTableAsCleaning(table.id, table.reservationId);
  };

  const handleMarkAvailable = async (table: Table) => {
    // This action works for tables that were 'Cleaning' or were 'Occupied' by a walk-in.
    await markTableAsAvailable(table.id);
  };

  const handleMarkOccupied = async (table: Table) => {
    // This action is for walk-in customers.
    await markTableAsOccupied(table.id, tCard('walkInCustomer'));
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
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
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
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filteredTables.length === 0 ? (
                <p className="text-center p-8 text-muted-foreground">
                  {searchQuery ? t('noResults') : t('noTables')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTables.map((table) => {
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
                            {table.customerName ? (
                              <span>{table.customerName}</span>
                            ) : (
                              <span>{tCard("noCustomer")}</span>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-stretch gap-2">
                          {/* Waiter Actions */}
                          {user?.isWaiter && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkCleaning(table)}
                                disabled={table.status !== "Occupied"}
                              >
                                <Brush className="mr-2 h-4 w-4" />{" "}
                                {t("actions.markCleaning")}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkAvailable(table)}
                                disabled={table.status !== "Cleaning"}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />{" "}
                                {t("actions.markAvailable")}
                              </Button>
                            </>
                          )}

                          {/* Receptionist Actions */}
                          {user?.isReceptionist && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkOccupied(table)}
                                disabled={table.status !== "Available"}
                              >
                                <User className="mr-2 h-4 w-4" />{" "}
                                {t("actions.markOccupied")}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkCleaning(table)}
                                disabled={table.status !== "Occupied"}
                              >
                                <Brush className="mr-2 h-4 w-4" />{" "}
                                {t("actions.markCleaning")}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkAvailable(table)}
                                disabled={table.status !== "Cleaning" && (table.status !== "Occupied" || !!table.reservationId)}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />{" "}
                                {t("actions.markAvailable")}
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
