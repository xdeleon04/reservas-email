
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
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Reservation = {
  id: string;
  name: string;
  email: string;
  time: string;
  status: "Pending" | "Confirmed" | "Cancelled";
};

const initialReservations: Reservation[] = [
    { id: "res-001", name: "Alice Johnson", email: "alice@example.com", time: "2024-10-26 19:00", status: "Confirmed" },
    { id: "res-002", name: "Bob Williams", email: "bob@example.com", time: "2024-10-26 19:30", status: "Pending" },
    { id: "res-003", name: "Charlie Brown", email: "charlie@example.com", time: "2024-10-27 18:00", status: "Pending" },
    { id: "res-004", name: "Diana Prince", email: "diana@example.com", time: "2024-10-27 20:00", status: "Cancelled" },
    { id: "res-005", name: "Ethan Hunt", email: "ethan@example.com", time: "2024-10-28 21:00", status: "Confirmed" },
];

export default function AdminReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);

  const handleStatusChange = (id: string, status: Reservation["status"]) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleDelete = (id: string) => {
    setReservations(reservations.filter(r => r.id !== id));
  };

  const statusVariant = {
    Pending: "secondary",
    Confirmed: "default",
    Cancelled: "destructive",
  } as const;


  return (
    <Card>
        <CardHeader>
            <CardTitle>All Reservations</CardTitle>
            <CardDescription>View and manage all customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Time</TableHead>
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
                    <TableCell>{new Date(res.time).toLocaleString()}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(res.id, "Confirmed")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(res.id, "Cancelled")}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(res.id)}>
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
            {reservations.length === 0 && <p className="text-center p-8 text-muted-foreground">No reservations found.</p>}
        </CardContent>
    </Card>
  );
}
