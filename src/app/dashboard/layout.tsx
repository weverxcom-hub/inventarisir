import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 flex min-h-screen flex-col">
        <div className="flex-1 p-4 pt-16 md:p-8 md:pt-8">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
