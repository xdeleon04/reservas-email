
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

export type Table = z.infer<typeof TableSchema> & { id: string };

export default function AdminTablePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(undefined);

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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      await deleteDoc(doc(db, "tables", id));
    }
  };

  const handleSave = async (tableData: z.infer<typeof TableSchema>) => {
    if (editingTable) {
      const tableRef = doc(db, "tables", editingTable.id);
      await updateDoc(tableRef, tableData);
    } else {
      await addDoc(collection(db, "tables"), tableData);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Tables</CardTitle>
                <CardDescription>Add, edit, or remove restaurant tables.</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Table
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
                        <TableHead>Name</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tables.map((table) => (
                        <TableRow key={table.id}>
                            <TableCell className="font-medium">{table.name}</TableCell>
                            <TableCell>{table.capacity}</TableCell>
                            <TableCell>{table.status}</TableCell>
                            <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(table)}
                            >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(table.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {tables.length === 0 && <p className="text-center p-8 text-muted-foreground">No tables configured. Add one to get started.</p>}
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
    </>
  );
}
