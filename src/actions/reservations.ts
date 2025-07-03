
'use server'

import admin from '@/lib/firebase-admin';

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
