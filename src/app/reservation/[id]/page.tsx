
import { redirect } from 'next/navigation';

export default function ReservationRedirectPage({ params }: { params: { id: string } }) {
  // Pass search params if they exist, though the new page won't use them.
  redirect(`/reservation/${params.id}`);
}
