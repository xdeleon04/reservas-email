
'use server'

import admin from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Table } from '@/app/[locale]/admin/tables/page';

export type ReservationReview = {
  id: string;
  name: string;
  reservationTime: string; // ISO String
  createdAt: string; // ISO String
  status: "Confirmed" | "Pending" | "Cancelled" | "Seated" | "Completed";
  guests: number;
};

export async function getReservationsByEmail(email: string): Promise<ReservationReview[]> {
    try {
        const snapshot = await admin.firestore()
            .collection('reservations')
            .where('email', '==', email.toLowerCase())
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        const reservations: ReservationReview[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reservations.push({ 
                id: doc.id,
                name: data.name,
                guests: data.guests,
                status: data.status,
                // Convert timestamps to ISO strings for serialization
                reservationTime: data.reservationTime.toDate().toISOString(),
                createdAt: data.createdAt.toDate().toISOString(),
            });
        });

        return reservations;
    } catch (error) {
        console.error("Error fetching reservations by email:", error);
        return [];
    }
}

// Result type for actions
type ActionResult = { success: boolean, error?: string };

// New server actions
export async function confirmReservation(reservationId: string, reservationName: string, table: Table): Promise<ActionResult> {
    try {
        const batch = admin.firestore().batch();

        const resRef = admin.firestore().collection('reservations').doc(reservationId);
        batch.update(resRef, { 
            status: "Confirmed",
            assignedTableId: table.id,
            assignedTableName: table.name,
        });

        const tableRef = admin.firestore().collection('tables').doc(table.id);
        batch.update(tableRef, { 
            status: "Reserved",
            customerName: reservationName,
            reservationId: reservationId,
        });

        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error: any) {
        console.error("Error confirming reservation:", error);
        return { success: false, error: error.message };
    }
}

export async function seatGuests(reservationId: string, tableId: string): Promise<ActionResult> {
    try {
        const db = admin.firestore();
        const batch = db.batch();

        const resRef = db.collection('reservations').doc(reservationId);
        
        // Get reservation data to retrieve the name
        const reservationDoc = await resRef.get();
        if (!reservationDoc.exists) {
            throw new Error("Reservation not found.");
        }
        const reservationData = reservationDoc.data();
        const customerName = reservationData?.name;
        const billAmount = Math.floor(Math.random() * (250 - 30 + 1)) + 30; // Random bill between $30 and $250

        // Update reservation
        batch.update(resRef, { 
            status: "Seated",
            billAmount: billAmount,
        });

        // Update table with denormalized data for payment processing
        const tableRef = db.collection('tables').doc(tableId);
        batch.update(tableRef, { 
            status: "Occupied",
            customerName: customerName,
            billAmount: billAmount,
        });

        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error seating guests:", error);
        return { success: false, error: error.message };
    }
}

export async function completeReservation(tableId: string, paymentMethod: string, reservationId?: string): Promise<ActionResult> {
    try {
        const batch = admin.firestore().batch();
        
        if (reservationId) {
            const resRef = admin.firestore().collection('reservations').doc(reservationId);
            batch.update(resRef, { 
                status: "Completed",
                paymentMethod: paymentMethod,
            });
        }

        const tableRef = admin.firestore().collection('tables').doc(tableId);
        batch.update(tableRef, {
            status: "Cleaning", // Change status to Cleaning
            customerName: null,
            reservationId: null,
            billAmount: null,
        });

        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error completing reservation:", error);
        return { success: false, error: error.message };
    }
}

export async function cancelReservation(reservationId: string, tableId: string | null): Promise<ActionResult> {
    try {
        const batch = admin.firestore().batch();

        const resRef = admin.firestore().collection('reservations').doc(reservationId);
        batch.update(resRef, { 
            status: "Cancelled",
            assignedTableId: null,
            assignedTableName: null
        });

        if (tableId) {
            const tableRef = admin.firestore().collection('tables').doc(tableId);
            batch.update(tableRef, { 
                status: "Available",
                customerName: null,
                reservationId: null
            });
        }
        
        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error cancelling reservation:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteReservation(reservationId: string, tableId: string | null): Promise<ActionResult> {
    try {
        const batch = admin.firestore().batch();

        const resRef = admin.firestore().collection('reservations').doc(reservationId);
        batch.delete(resRef);

        if (tableId) {
            const tableRef = admin.firestore().collection('tables').doc(tableId);
            batch.update(tableRef, {
                status: "Available",
                customerName: null,
                reservationId: null,
                billAmount: null,
            });
        }

        await batch.commit();
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting reservation:", error);
        return { success: false, error: error.message };
    }
}
