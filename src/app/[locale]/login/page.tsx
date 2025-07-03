
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
import { useRouter } from "next-intl/navigation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function getFirebaseErrorMessage(error: any) {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/invalid-email':
                return t('toast.invalidEmail');
            case 'auth/user-disabled':
                return t('toast.userDisabled');
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                return t('toast.invalidCredential');
            case 'auth/wrong-password':
                return t('toast.invalidCredential');
            default:
                return t('toast.unknownError');
        }
    }
    return t('toast.checkCredentials');
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    const error = await login(values.email, values.password);
    if (error) {
      toast({
        variant: "destructive",
        title: t('toast.title'),
        description: getFirebaseErrorMessage(error),
      });
    } else {
        router.push("/admin");
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
