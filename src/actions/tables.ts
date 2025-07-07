
'use server'

import admin from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Table } from '@/app/[locale]/admin/tables/page';

const db = admin.firestore();

type ActionResult = { success: boolean, error?: string };

export async function addTable(tableData: Omit<Table, 'id'>): Promise<ActionResult> {
    try {
        await db.collection('tables').add(tableData);
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTable(tableId: string, newData: Partial<Table>): Promise<ActionResult> {
    const tableRef = db.collection('tables').doc(tableId);

    try {
        await db.runTransaction(async (transaction) => {
            const tableDoc = await transaction.get(tableRef);
            if (!tableDoc.exists) {
                throw new Error("Table not found.");
            }
            const oldData = tableDoc.data() as Table;

            const oldStatus = oldData.status;
            const newStatus = newData.status;

            let updatePayload: any = { ...newData };

            if (oldStatus !== newStatus) {
                if (oldStatus === 'Available' && newStatus === 'Occupied') {
                    const orderRef = db.collection('orders').doc();
                    const walkInCustomerName = "Walk-in";
                    updatePayload.customerName = walkInCustomerName;
                    updatePayload.reservationId = null;
                    updatePayload.orderId = orderRef.id;

                    transaction.set(orderRef, {
                        tableId,
                        tableName: newData.name,
                        customerName: walkInCustomerName,
                        items: [],
                        status: 'open',
                        total: 0,
                        amountPaid: 0,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else if (oldStatus === 'Occupied' && newStatus === 'Available') {
                    throw new Error("This table is occupied. Please use the payment screen to close the order, which will then mark the table for cleaning.");
                } else if (oldStatus === 'Reserved' && oldData.reservationId) {
                    throw new Error("This table is reserved. To make it available, please cancel the corresponding reservation from the Reservations page.");
                } else if (newStatus === 'Reserved') {
                    throw new Error("Tables can only be marked as 'Reserved' by confirming a reservation.");
                } else if ((oldStatus === 'Occupied' || oldStatus === 'Reserved') && newStatus === 'Cleaning') {
                    throw new Error("This status change happens automatically after payment or cancellation. Please use the correct workflow.");
                } else if (oldStatus === 'Cleaning' && newStatus === 'Available') {
                    updatePayload.customerName = null;
                    updatePayload.reservationId = null;
                    updatePayload.orderId = null;
                }
            }

            transaction.update(tableRef, updatePayload);
        });

        revalidatePath('/admin/tables');
        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating table:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
    try {
        const tableRef = db.collection('tables').doc(tableId);
        const tableDoc = await tableRef.get();
        if (tableDoc.exists) {
            const tableData = tableDoc.data();
            if (tableData?.status === 'Occupied' || tableData?.status === 'Reserved') {
                 throw new Error(`Cannot delete table "${tableData.name}" while it is ${tableData.status}.`);
            }
        }
        await tableRef.delete();
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

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

export async function markTableAsOccupied(tableId: string, customerName: string): Promise<ActionResult> {
    try {
        const batch = db.batch();
        const tableRef = db.collection('tables').doc(tableId);
        
        const tableDoc = await tableRef.get();
        if (!tableDoc.exists) throw new Error("Table not found.");
        const tableData = tableDoc.data()!;

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

        batch.update(tableRef, {
            status: 'Occupied',
            customerName: customerName,
            reservationId: null,
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
