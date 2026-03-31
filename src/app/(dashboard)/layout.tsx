import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
