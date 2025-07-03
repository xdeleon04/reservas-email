
"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

type Reservation = {
  id: string;
  name: string;
  reservationTime: Timestamp;
  createdAt: Timestamp;
  status: "Confirmed" | "Pending" | "Cancelled" | "Seated" | "Completed";
  guests: number;
};

export function ReviewForm() {
  const t = useTranslations('ReviewForm');
  const tStatus = useTranslations('Statuses');
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchReservations() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
          const q = query(
              collection(db, "reservations"), 
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const foundReservations: Reservation[] = [];
          querySnapshot.forEach((doc) => {
              foundReservations.push({ id: doc.id, ...doc.data() } as Reservation);
          });
          setReservations(foundReservations);
      } catch (error) {
          console.error("Error fetching reservations: ", error);
          setReservations([]);
      } finally {
          setIsLoading(false);
      }
    }

    fetchReservations();
  }, [user]);
  
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleString();
  }

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="text-center text-muted-foreground flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('submitting')}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-headline mb-4 text-center">
            {t('results.title', {count: reservations.length})}
          </h2>
          {reservations.length > 0 ? (
            <div className="space-y-4">
              {reservations.map((res) => (
                <Card key={res.id} className="bg-background">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-base">
                        <span>{t('results.bookedOn', {date: formatTimestamp(res.createdAt).split(',')[0]})}</span>
                        <Badge variant={
                                res.status === 'Confirmed' || res.status === 'Seated' ? 'default' 
                                : res.status === 'Cancelled' ? 'destructive' 
                                : res.status === 'Completed' ? 'outline'
                                : 'secondary'
                            }
                            className="text-sm"
                        >
                            {tStatus(res.status)}
                        </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-2">
                     <p className="flex items-center"><Clock className="mr-2 h-4 w-4"/> {t('results.reservationFor', {datetime: formatTimestamp(res.reservationTime)})}</p>
                     <p className="flex items-center"><Users className="mr-2 h-4 w-4"/> {t('results.guests', {count: res.guests})}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-4">
              {t('results.notFound')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
