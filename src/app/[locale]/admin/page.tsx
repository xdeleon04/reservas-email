
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
  UserCheck,
  CheckCircle2,
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
import type { Table as TableType } from "./tables/page";
import { ConfirmReservationDialog } from "@/components/ConfirmReservationDialog";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";

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
};

export default function AdminReservationPage() {
  const t = useTranslations('AdminReservationPage');
  const tStatus = useTranslations('Statuses');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [reservationToConfirm, setReservationToConfirm] = useState<Reservation | null>(null);

  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is not authorized to see this page
  useEffect(() => {
    if (!isAuthLoading && user && !user.isAdmin && !user.isReceptionist) {
      router.replace('/admin/tables');
    }
  }, [user, isAuthLoading, router]);

  // Fetch reservations only if user is authorized
  useEffect(() => {
    if (user?.isAdmin || user?.isReceptionist) {
      const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const reservationsData: Reservation[] = [];
          querySnapshot.forEach((doc) => {
              reservationsData.push({ id: doc.id, ...doc.data() } as Reservation);
          });
          setReservations(reservationsData);
          setIsLoading(false);
      }, (error) => {
          console.error("Firestore snapshot error in AdminReservationPage:", error);
          setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      if (!isAuthLoading) setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  // Fetch tables (all staff can do this)
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
    
    batch.update(resRef, { 
        status: "Cancelled",
        assignedTableId: null,
        assignedTableName: null
    });

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

  const handleSeatGuests = async (reservation: Reservation) => {
    if (reservation.assignedTableId) {
        const batch = writeBatch(db);
        const resRef = doc(db, "reservations", reservation.id);
        batch.update(resRef, { status: "Seated" });

        const tableRef = doc(db, "tables", reservation.assignedTableId);
        batch.update(tableRef, { status: "Occupied" });

        await batch.commit();
    }
  };

  const handleCompleteReservation = async (reservation: Reservation) => {
      if (reservation.assignedTableId) {
          const batch = writeBatch(db);
          const resRef = doc(db, "reservations", reservation.id);
          batch.update(resRef, { status: "Completed" });

          const tableRef = doc(db, "tables", reservation.assignedTableId);
          batch.update(tableRef, { status: "Available" });

          await batch.commit();
      }
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
    Seated: "default",
    Completed: "outline",
    Cancelled: "destructive",
  } as const;
  
  const formatTimestamp = (timestamp?: Timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleString();
  }

  // Show loader while auth is resolving or if user is being redirected
  if (isAuthLoading || (user && !user.isAdmin && !user.isReceptionist)) {
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
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>{t('cardDescription')}</CardDescription>
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
                  <TableHead>{t('tableHead.customer')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('tableHead.guests')}</TableHead>
                  <TableHead>{t('tableHead.dateTime')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('tableHead.table')}</TableHead>
                  <TableHead>{t('tableHead.status')}</TableHead>
                  <TableHead>
                      <span className="sr-only">{t('actions.label')}</span>
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
                          <Badge variant={statusVariant[res.status]}>{tStatus(res.status)}</Badge>
                      </TableCell>
                      <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('actions.toggleMenu')}</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleConfirmClick(res)} disabled={res.status !== 'Pending'}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('actions.confirm')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSeatGuests(res)} disabled={res.status !== 'Confirmed'}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              {t('actions.seat')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCompleteReservation(res)} disabled={res.status !== 'Seated'}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {t('actions.complete')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCancelReservation(res)} disabled={!['Pending', 'Confirmed'].includes(res.status)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              {t('actions.cancel')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleDeleteClick(res)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('actions.delete')}
                          </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
              </Table>
              {reservations.length === 0 && !isLoading && <p className="text-center p-8 text-muted-foreground">{t('noReservations')}</p>}
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
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {name: reservationToDelete?.name, datetime: formatTimestamp(reservationToDelete?.reservationTime)})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservationToDelete(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
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
