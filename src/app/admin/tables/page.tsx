
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
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { TableDialog, TableSchema } from "@/components/TableDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { z } from "zod";

export type Table = z.infer<typeof TableSchema> & { id: string };

const initialTables: Table[] = [
    { id: "tbl-01", name: "Main Booth 1", capacity: 4, status: "Available" },
    { id: "tbl-02", name: "Window Seat 2", capacity: 2, status: "Reserved" },
    { id: "tbl-03", name: "Patio High-Top", capacity: 4, status: "Available" },
    { id: "tbl-04", name: "Bar Seat 5", capacity: 1, status: "Occupied" },
    { id: "tbl-05", name: "Family Table", capacity: 8, status: "Available" },
];

export default function AdminTablePage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(undefined);

  const handleAdd = () => {
    setEditingTable(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTables(tables.filter((t) => t.id !== id));
  };

  const handleSave = (tableData: z.infer<typeof TableSchema>) => {
    if (editingTable) {
      setTables(
        tables.map((t) => (t.id === editingTable.id ? { ...t, ...tableData } : t))
      );
    } else {
      const newTable: Table = {
        id: `tbl-${Math.random().toString(16).slice(2)}`,
        ...tableData,
      };
      setTables([...tables, newTable]);
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
