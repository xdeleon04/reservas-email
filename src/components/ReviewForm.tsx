"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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
import { useTranslations } from "next-intl";
import { getReservationsByEmail, type ReservationReview } from "@/actions/reservations";

const reviewSchema = z.object({
  email: z.string().email(),
});

export function ReviewForm() {
  const t = useTranslations('ReviewForm');
  const tStatus = useTranslations('Statuses');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservations, setReservations] = useState<ReservationReview[]>([]);
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema.extend({
        email: z.string().email({ message: t('validation.email') }),
    })),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    setIsSubmitting(true);
    setSearchedEmail(values.email);
    const foundReservations = await getReservationsByEmail(values.email);
    setReservations(foundReservations);
    setIsSubmitting(false);
  }

  const formatTimestamp = (isoString: string) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString();
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
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('emailPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </Form>
      
      {isSubmitting ? (
         <div className="text-center text-muted-foreground flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('submitting')}
        </div>
      ) : searchedEmail && (
        <div>
          <h2 className="text-xl font-headline mb-4 text-center">
            {t('results.title', {count: reservations.length})}
          </h2>
          {reservations.length > 0 ? (
            <div className="space-y-6">
              {reservations.map((res) => (
                <Card key={res.id} className="bg-card flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
                  <div className="flex flex-col p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-headline font-bold text-foreground pr-4">
                          {t('results.reservationFor', {datetime: formatTimestamp(res.reservationTime)})}
                        </h3>
                        <Badge variant={
                                res.status === 'Confirmed' || res.status === 'Seated' ? 'default' 
                                : res.status === 'Cancelled' ? 'destructive' 
                                : res.status === 'Completed' ? 'outline'
                                : 'secondary'
                            }
                            className="text-sm whitespace-nowrap"
                        >
                            {tStatus(res.status)}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('results.bookedOn', {date: new Date(res.createdAt).toLocaleDateString()})}
                    </p>
            
                    <div className="mt-auto flex items-center text-muted-foreground pt-4 border-t">
                      <Users className="mr-2 h-4 w-4"/>
                      <span>{t('results.guests', {count: res.guests})}</span>
                    </div>
                  </div>
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
