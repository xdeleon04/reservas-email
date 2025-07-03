
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useState, useMemo } from "react";
import type { Table } from "@/app/admin/tables/page";
import type { Timestamp } from "firebase/firestore";

// Using a broader type to accommodate what's passed from the admin page.
type Reservation = {
  id: string;
  name: string;
  guests: number;
  [key: string]: any; // Allow other properties
};

type ConfirmReservationDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (reservation: Reservation, table: Table) => void;
  reservation: Reservation;
  tables: Table[];
};

export function ConfirmReservationDialog({
  isOpen,
  setIsOpen,
  onSave,
  reservation,
  tables,
}: ConfirmReservationDialogProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  const availableTables = useMemo(() => {
    return tables.filter(
      (table) => table.status === "Available" && table.capacity >= reservation.guests
    );
  }, [tables, reservation.guests]);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const handleSubmit = () => {
    if (selectedTable) {
      onSave(reservation, selectedTable);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Confirm Reservation</DialogTitle>
          <DialogDescription>
            Assign an available table to confirm the reservation for {reservation.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Guests:</span>
                <span className="text-sm">{reservation.guests}</span>
            </div>
            <div className="space-y-2">
                <Label htmlFor="table-select">Assign Table</Label>
                <Select onValueChange={setSelectedTableId} value={selectedTableId}>
                    <SelectTrigger id="table-select">
                        <SelectValue placeholder="Select an available table" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTables.length > 0 ? (
                            availableTables.map((table) => (
                                <SelectItem key={table.id} value={table.id}>
                                    {table.name} (Capacity: {table.capacity})
                                </SelectItem>
                            ))
                        ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No available tables fit.</div>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedTableId}>
            Confirm & Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
