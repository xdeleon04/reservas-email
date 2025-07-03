
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Clock, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const reviewSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

type Reservation = {
  id: string;
  name: string;
  time: string;
  createdAt: Timestamp;
  status: "Confirmed" | "Pending" | "Cancelled";
};

export function ReviewForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!user) {
        // This case should be rare, as anonymous auth should always provide a user.
        // You could show a toast message here if desired.
        return;
    }
    setIsLoading(true);
    setReservations(null);
    setSearchedEmail(values.email);

    try {
        const q = query(
            collection(db, "reservations"), 
            where("email", "==", values.email.toLowerCase()),
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
  
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleString();
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !user}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Find Reservations
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center text-muted-foreground flex items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching for reservations...
        </div>
      )}

      {reservations && searchedEmail && (
        <div>
          <Separator className="my-6" />
          <h2 className="text-xl font-headline mb-4 text-center">
            Found {reservations.length} reservation(s) for{" "}
            <span className="font-bold text-primary">{searchedEmail}</span>
          </h2>
          {reservations.length > 0 ? (
            <div className="space-y-4">
              {reservations.map((res) => (
                <Card key={res.id} className="bg-background">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-base">
                        <span>Booked on {formatTimestamp(res.createdAt).split(',')[0]}</span>
                        <Badge variant={res.status === 'Confirmed' ? 'default' : res.status === 'Cancelled' ? 'destructive' : 'secondary'}
                            className="text-sm"
                        >
                            {res.status}
                        </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-2">
                     <p className="flex items-center"><Clock className="mr-2 h-4 w-4"/> Reservation for {res.time}</p>
                     <p className="flex items-center"><Hash className="mr-2 h-4 w-4"/> Booking ID: {res.id}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-4">
              No reservations found for this email address.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
