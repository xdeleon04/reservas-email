
'use server'

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { MenuItem } from '@/lib/models';

const db = admin.firestore();

export const MenuItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  category: z.string().min(3, "Category is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
});

type ActionResult = { success: boolean, error?: string };

export async function addMenuItem(data: z.infer<typeof MenuItemSchema>): Promise<ActionResult> {
    try {
        await db.collection('menuItems').add({
            ...data,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMenuItem(id: string, data: z.infer<typeof MenuItemSchema>): Promise<ActionResult> {
    try {
        await db.collection('menuItems').doc(id).update(data);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
    try {
        await db.collection('menuItems').doc(id).delete();
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
