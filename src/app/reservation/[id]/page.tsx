
"use client";

import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Mail, User, Clock, Tag } from "lucide-react";
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ReservationDetails({ reservationId }: { reservationId: string }) {
    const searchParams = useSearchParams()
    const name = searchParams.get('name') || "Guest";
    const email = searchParams.get('email') || "No email provided";
    const time = searchParams.get('time') || "Not specified";
    
    const id = reservationId || "N/A";

    return (
        <div className="border-t pt-6 mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-lg text-foreground text-center">
            Your Reservation Details:
            </p>
            <div className="flex items-center">
                <User className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">Name:</span>
                <span className="ml-auto">{name}</span>
            </div>
            <div className="flex items-center">
                <Mail className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">Email:</span>
                <span className="ml-auto">{email}</span>
            </div>
            <div className="flex items-center">
                <Clock className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">Time:</span>
                <span className="ml-auto">{time}</span>
            </div>
            <div className="flex items-center">
                <Tag className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">Booking ID:</span>
                <span className="ml-auto font-mono">#{id}</span>
            </div>
        </div>
    )
}

function ReservationConfirmationPageContent({ reservationId }: { reservationId: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg animate-fade-in-up">
          <CardHeader className="items-center text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-headline">
              Reservation Submitted!
            </CardTitle>
            <CardDescription className="pt-2">
              Your booking is pending. A final confirmation will be sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <ReservationDetails reservationId={reservationId} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


export default function ReservationConfirmationPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReservationConfirmationPageContent reservationId={params.id}/>
        </Suspense>
    )
}
