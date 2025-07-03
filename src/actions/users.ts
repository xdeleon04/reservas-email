
'use server'

import admin from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';

// Re-usable type for the user object we'll pass to the client
export type AppUser = {
    uid: string;
    email: string | undefined;
    displayName: string | undefined;
    role: string | undefined;
    disabled: boolean;
};

export async function getUsers(): Promise<AppUser[]> {
    try {
        const userRecords = await admin.auth().listUsers();
        // Filter out users who don't have an email (e.g., anonymous users)
        return userRecords.users.filter(user => !!user.email).map((user: UserRecord) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: (user.customClaims?.role as string) || 'N/A',
            disabled: user.disabled,
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

type SetRoleResult = { success: boolean, error?: string };
export async function setUserRole(uid: string, role: string): Promise<SetRoleResult> {
    if (!['admin', 'receptionist', 'waiter'].includes(role)) {
        return { success: false, error: 'Invalid role specified.' };
    }
    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error("Error setting user role:", error);
        return { success: false, error: error.message };
    }
}

type DeleteUserResult = { success: boolean, error?: string };
export async function deleteUser(uid: string): Promise<DeleteUserResult> {
    try {
        await admin.auth().deleteUser(uid);
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message };
    }
}
