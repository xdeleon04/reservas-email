
'use server'

import admin from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const db = admin.firestore();

// Generic result type for actions
type ActionResult = { success: boolean, error?: string };

/**
 * Marks a table as 'Available' and clears customer/reservation info.
 */
export async function markTableAsAvailable(tableId: string): Promise<ActionResult> {
    try {
        const tableRef = db.collection('tables').doc(tableId);
        await tableRef.update({
            status: 'Available',
            customerName: null,
            reservationId: null
        });
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error: any) {
        console.error("Error marking table as available:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Marks a table as 'Occupied' for a walk-in customer.
 */
export async function markTableAsOccupied(tableId: string, customerName: string): Promise<ActionResult> {
    try {
        const tableRef = db.collection('tables').doc(tableId);
        await tableRef.update({
            status: 'Occupied',
            customerName: customerName,
            reservationId: null, // Explicitly null for walk-ins
            billAmount: Math.floor(Math.random() * (250 - 30 + 1)) + 30,
        });
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error marking table as occupied:", error);
        return { success: false, error: error.message };
    }
}
