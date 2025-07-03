
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function ReservationForm() {
  const t = useTranslations('ReservationForm');
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const reservationSchema = z.object({
    name: z.string().min(2, {
      message: t('validation.name'),
    }),
    email: z.string().email({
      message: t('validation.email'),
    }),
    guests: z.coerce.number().min(1, { message: t('validation.guests')}),
    date: z.date({
      required_error: t('validation.date'),
    }),
    time: z.string({
      required_error: t('validation.time'),
    }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: t('validation.time') }),
  });

  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: "",
      email: "",
      guests: 1,
      time: "18:00",
    },
  });

  async function onSubmit(values: z.infer<typeof reservationSchema>) {
    if (!user) {
      toast({
          variant: "destructive",
          title: t('toast.authErrorTitle'),
          description: t('toast.authErrorDescription'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationDateTime = new Date(`${format(values.date, "yyyy-MM-dd")}T${values.time}`);

      const docRef = await addDoc(collection(db, "reservations"), {
        name: values.name,
        email: values.email.toLowerCase(),
        guests: values.guests,
        status: "Pending",
        createdAt: serverTimestamp(),
        reservationTime: reservationDateTime,
      });
      
      toast({
          title: t('toast.successTitle'),
          description: t('toast.successDescription'),
      });

      const queryParams = new URLSearchParams({
        name: values.name,
        email: values.email,
        time: reservationDateTime.toISOString(),
        guests: values.guests.toString(),
      });

      router.push(`/reservation/${docRef.id}?${queryParams.toString()}`);
    } catch (error) {
        console.error("Error adding reservation: ", error);
        toast({
            variant: "destructive",
            title: t('toast.failTitle'),
            description: t('toast.failDescription'),
        });
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fullName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('fullNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>
         <FormField
            control={form.control}
            name="guests"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('guests')}</FormLabel>
                <FormControl>
                    <Input type="number" placeholder={t('guestsPlaceholder')} {...field} min="1"/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>{t('date')}</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>{t('pickDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                            date < new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('time')}</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
