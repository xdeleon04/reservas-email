
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, query, orderBy, Timestamp, writeBatch, deleteDoc } from "firebase/firestore";
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
import type { Table as TableType } from "@/app/admin/tables/page";
import { ConfirmReservationDialog } from "@/components/ConfirmReservationDialog";

type Reservation = {
  id: string;
  name: string;
  email: string;
  guests: number;
  reservationTime: Timestamp;
  createdAt: Timestamp;
  status: "Pending" | "Confirmed" | "Cancelled";
  assignedTableId?: string;
  assignedTableName?: string;
};

export default function AdminReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [reservationToConfirm, setReservationToConfirm] = useState<Reservation | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reservationsData: Reservation[] = [];
        querySnapshot.forEach((doc) => {
            reservationsData.push({ id: doc.id, ...doc.data() } as Reservation);
        });
        setReservations(reservationsData);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tables"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tablesData: TableType[] = [];
        querySnapshot.forEach((doc) => {
            tablesData.push({ id: doc.id, ...doc.data() } as TableType);
        });
        setTables(tablesData);
    });
    return () => unsubscribe();
  }, []);
  
  const handleCancelReservation = async (reservation: Reservation) => {
    const batch = writeBatch(db);
    const resRef = doc(db, "reservations", reservation.id);
    
    // Update reservation status and remove table assignment
    batch.update(resRef, { 
        status: "Cancelled",
        assignedTableId: null,
        assignedTableName: null
    });

    // If a table was assigned, make it available again
    if (reservation.assignedTableId) {
        const tableRef = doc(db, "tables", reservation.assignedTableId);
        batch.update(tableRef, { status: "Available" });
    }
    await batch.commit();
  };

  const handleConfirmClick = (reservation: Reservation) => {
    setReservationToConfirm(reservation);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSave = async (reservation: Reservation, table: TableType) => {
      const batch = writeBatch(db);

      const resRef = doc(db, "reservations", reservation.id);
      batch.update(resRef, { 
          status: "Confirmed",
          assignedTableId: table.id,
          assignedTableName: table.name,
       });

      const tableRef = doc(db, "tables", table.id);
      batch.update(tableRef, { status: "Reserved" });

      await batch.commit();
      setIsConfirmDialogOpen(false);
      setReservationToConfirm(null);
  }
  
  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (reservationToDelete) {
      await deleteDoc(doc(db, "reservations", reservationToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setReservationToDelete(null);
  };

  const statusVariant = {
    Pending: "secondary",
    Confirmed: "default",
    Cancelled: "destructive",
  } as const;
  
  const formatTimestamp = (timestamp?: Timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleString();
  }

  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle>All Reservations</CardTitle>
              <CardDescription>View and manage all customer bookings.</CardDescription>
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
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Guests</TableHead>
                  <TableHead>Reservation Date &amp; Time</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned Table</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                      <span className="sr-only">Actions</span>
                  </TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {reservations.map((res) => (
                  <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{res.guests}</TableCell>
                      <TableCell>{formatTimestamp(res.reservationTime)}</TableCell>
                      <TableCell className="hidden md:table-cell">{res.assignedTableName || "N/A"}</TableCell>
                      <TableCell>
                          <Badge variant={statusVariant[res.status]}>{res.status}</Badge>
                      </TableCell>
                      <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleConfirmClick(res)} disabled={res.status === 'Confirmed'}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCancelReservation(res)} disabled={res.status === 'Cancelled'}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleDeleteClick(res)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                          </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
              </Table>
              {reservations.length === 0 && !isLoading && <p className="text-center p-8 text-muted-foreground">No reservations found.</p>}
              </>
              )}
          </CardContent>
      </Card>

      {reservationToConfirm && (
        <ConfirmReservationDialog
            isOpen={isConfirmDialogOpen}
            setIsOpen={setIsConfirmDialogOpen}
            onSave={handleConfirmSave}
            reservation={reservationToConfirm}
            tables={tables}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reservation for {reservationToDelete?.name} on {formatTimestamp(reservationToDelete?.reservationTime)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
