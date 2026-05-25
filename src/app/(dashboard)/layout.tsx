// app/(dashboard)/layout.tsx
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="flex-1 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
