
import { ReactNode } from "react";

// This layout is only necessary to allow the page to redirect.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
