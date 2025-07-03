
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
