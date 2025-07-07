
'use server'

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Order, OrderItem, MenuItem } from '@/lib/models';
import { randomUUID } from 'crypto';

const db = admin.firestore();

type ActionResult = { success: boolean, error?: string };

export async function addItemToOrder(orderId: string, menuItem: MenuItem, quantity: number): Promise<ActionResult> {
    try {
        const orderRef = db.collection('orders').doc(orderId);
        
        await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new Error("Order not found!");
            }
            const order = orderDoc.data() as Order;

            const existingItemIndex = order.items.findIndex(item => item.menuItemId === menuItem.id);
            const newItems = [...order.items];

            if (existingItemIndex > -1) {
                newItems[existingItemIndex].quantity += quantity;
            } else {
                 newItems.push({
                    id: randomUUID(),
                    menuItemId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity,
                    paid: false,
                });
            }
           
            const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            transaction.update(orderRef, { items: newItems, total: newTotal });
        });

        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error("Error adding item to order:", error);
        return { success: false, error: error.message };
    }
}


export async function processPayment(orderId: string, tableId: string, paymentDetails: { amount: number; method: string; paidItemIds: string[] }): Promise<ActionResult> {
    const { amount, method, paidItemIds } = paymentDetails;
    
    try {
        const orderRef = db.collection('orders').doc(orderId);
        
        await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) throw new Error("Order not found");
            const order = orderDoc.data() as Order;

            const newAmountPaid = order.amountPaid + amount;

            const updatedItems = order.items.map(item => 
                paidItemIds.includes(item.id) ? { ...item, paid: true } : item
            );

            transaction.update(orderRef, {
                amountPaid: newAmountPaid,
                items: updatedItems
            });

            // If the full amount is paid, close the order and free up the table
            if (newAmountPaid >= order.total) {
                transaction.update(orderRef, { status: 'closed' });

                const tableRef = db.collection('tables').doc(tableId);
                transaction.update(tableRef, {
                    status: "Cleaning",
                    customerName: null,
                    reservationId: null,
                    orderId: null,
                });
                
                // If there's a linked reservation, mark it as completed.
                if (order.reservationId) {
                    const resRef = db.collection('reservations').doc(order.reservationId);
                    transaction.update(resRef, {
                        status: "Completed",
                        paymentMethod: method
                    });
                }
            }
        });

        revalidatePath('/admin/payments');
        revalidatePath('/admin/tables');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error("Error processing payment:", error);
        return { success: false, error: error.message };
    }
}
