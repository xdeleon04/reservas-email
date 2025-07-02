
import { Header } from "@/components/Header";
import { ReviewForm } from "@/components/ReviewForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl animate-fade-in-up">
            <CardHeader className="text-center p-8">
              <CardTitle className="text-3xl md:text-4xl font-headline tracking-tight">
                Review Your Reservation
              </CardTitle>
              <CardDescription className="text-lg pt-2">
                Enter your email address to find your bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <ReviewForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
