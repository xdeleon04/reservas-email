
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware will handle rewriting this to the default locale
  redirect('/');
}
