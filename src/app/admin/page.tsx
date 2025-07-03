
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
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

type Reservation = {
  id: string;
  name: string;
  email: string;
  reservationTime: Timestamp;
  createdAt: Timestamp;
  status: "Pending" | "Confirmed" | "Cancelled";
};

export default function AdminReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

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

  const handleStatusChange = async (id: string, status: Reservation["status"]) => {
    const resRef = doc(db, "reservations", id);
    await updateDoc(resRef, { status });
  };
  
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
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Booked At</TableHead>
                  <TableHead>Reservation Date &amp; Time</TableHead>
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
                      <TableCell className="hidden md:table-cell">{res.email}</TableCell>
                      <TableCell>{formatTimestamp(res.createdAt)}</TableCell>
                      <TableCell>{formatTimestamp(res.reservationTime)}</TableCell>
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
                          <DropdownMenuItem onSelect={() => handleStatusChange(res.id, "Confirmed")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange(res.id, "Cancelled")}>
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
