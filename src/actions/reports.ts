
'use server'

import admin from '@/lib/firebase-admin';
import type { Order, SalesSummary, OrderItem } from '@/lib/models';

const db = admin.firestore();

export async function getSalesSummary(): Promise<SalesSummary> {
    try {
        const ordersSnapshot = await db.collection('orders').where('status', '==', 'closed').get();
        
        if (ordersSnapshot.empty) {
            return { totalSales: 0, totalOrders: 0, popularItems: [] };
        }

        let totalSales = 0;
        const popularItemsMap = new Map<string, { name: string, quantity: number }>();

        ordersSnapshot.forEach(doc => {
            const order = doc.data() as Order;
            totalSales += order.total;
            
            order.items.forEach((item: OrderItem) => {
                if (popularItemsMap.has(item.menuItemId)) {
                    popularItemsMap.get(item.menuItemId)!.quantity += item.quantity;
                } else {
                    popularItemsMap.set(item.menuItemId, { name: item.name, quantity: item.quantity });
                }
            });
        });

        const popularItems = Array.from(popularItemsMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10); // Get top 10 items

        return {
            totalSales,
            totalOrders: ordersSnapshot.size,
            popularItems,
        };
    } catch (error) {
        console.error("Error generating sales summary:", error);
        // Return a default/empty summary in case of error
        return { totalSales: 0, totalOrders: 0, popularItems: [] };
    }
}
