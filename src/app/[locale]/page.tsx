
import { Header } from "@/components/Header";
import { ReservationForm } from "@/components/ReservationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl animate-fade-in-up">
            <CardHeader className="text-center p-8">
              <CardTitle className="text-3xl md:text-4xl font-headline tracking-tight">
                {t('title')}
              </CardTitle>
              <CardDescription className="text-lg pt-2">
                {t('description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <ReservationForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
