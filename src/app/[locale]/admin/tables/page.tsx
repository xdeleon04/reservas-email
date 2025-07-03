
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TableDialog, TableSchema } from "@/components/TableDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
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
import { useTranslations } from "next-intl";

export type Table = z.infer<typeof TableSchema> & { id: string };

export default function AdminTablePage() {
  const t = useTranslations('AdminTablePage');
  const tDialog = useTranslations('TableDialog');

  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(undefined);
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

  const getStatusTranslation = (status: 'Available' | 'Occupied' | 'Reserved') => {
      switch(status) {
          case 'Available': return tDialog('available');
          case 'Occupied': return tDialog('occupied');
          case 'Reserved': return tDialog('reserved');
          default: return status;
      }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('cardTitle')}</CardTitle>
                <CardDescription>{t('cardDescription')}</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addTable')}
            </Button>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>{t('tableHead.name')}</TableHead>
                        <TableHead>{t('tableHead.capacity')}</TableHead>
                        <TableHead>{t('tableHead.status')}</TableHead>
                        <TableHead>
                            <span className="sr-only">{t('actions.edit')}</span>
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tables.map((table) => (
                        <TableRow key={table.id}>
                            <TableCell className="font-medium">{table.name}</TableCell>
                            <TableCell>{table.capacity}</TableCell>
                            <TableCell>{getStatusTranslation(table.status)}</TableCell>
                            <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(table)}
                                title={t('actions.edit')}
                            >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('actions.edit')}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(table)}
                                title={t('actions.delete')}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t('actions.delete')}</span>
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {tables.length === 0 && <p className="text-center p-8 text-muted-foreground">{t('noTables')}</p>}
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {name: tableToDelete?.name})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTableToDelete(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
                {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
