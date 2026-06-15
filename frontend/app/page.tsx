// frontend/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  // Dùng redirect của Server Side cho nhanh và ổn định
  redirect("/dashboard");
}