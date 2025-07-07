
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
            reservationId: null,
            orderId: null,
        });
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error marking table as available:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Marks a table as 'Occupied' for a walk-in customer.
 * Also creates a new order for them.
 */
export async function markTableAsOccupied(tableId: string, customerName: string): Promise<ActionResult> {
    try {
        const batch = db.batch();
        const tableRef = db.collection('tables').doc(tableId);
        
        // Fetch table data to get its name
        const tableDoc = await tableRef.get();
        if (!tableDoc.exists) throw new Error("Table not found.");
        const tableData = tableDoc.data()!;

        // 1. Create a new Order for the walk-in
        const orderRef = db.collection('orders').doc();
        batch.set(orderRef, {
            tableId,
            tableName: tableData.name,
            customerName,
            items: [],
            status: 'open',
            total: 0,
            amountPaid: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Update Table status and link to Order
        batch.update(tableRef, {
            status: 'Occupied',
            customerName: customerName,
            reservationId: null, // Explicitly null for walk-ins
            orderId: orderRef.id,
        });

        await batch.commit();
        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error marking table as occupied:", error);
        return { success: false, error: error.message };
    }
}
