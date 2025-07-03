
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2 } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";

export default function SignupPage() {
  const t = useTranslations("SignupPage");
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const signupSchema = z.object({
    email: z.string().email({ message: t('toast.invalidEmail')}),
    password: z.string().min(6, { message: t('toast.weakPassword')}),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('toast.passwordMismatch'),
    path: ["confirmPassword"],
  });
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function getFirebaseErrorMessage(error: any) {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return t('toast.emailInUse');
            case 'auth/invalid-email':
                return t('toast.invalidEmail');
            case 'auth/weak-password':
                return t('toast.weakPassword');
            default:
                return t('toast.unknownError');
        }
    }
    return t('toast.unknownError');
  }

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsSubmitting(true);
    const error = await signup(values.email, values.password);
    if (error) {
      toast({
        variant: "destructive",
        title: t('toast.failTitle'),
        description: getFirebaseErrorMessage(error),
      });
    } else {
        toast({
            title: t('toast.successTitle'),
            description: t('toast.successDescription'),
        });
        router.push("/login");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('confirmPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? t('submitting') : t('submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="w-full" asChild>
                <Link href="/login">{t('backToLogin')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
