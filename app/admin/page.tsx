import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth"
import AdminDashboard from "@/components/admin-dashboard"

export const metadata = {
  title: "Admin Dashboard | Tucheki Streaming",
  description: "Manage trailers, ads, and view analytics for Tucheki Streaming",
}

export default async function AdminPage() {
  // Check if user is an admin
  const adminStatus = await isAdmin()

  if (!adminStatus) {
    // Redirect to login page if not an admin
    redirect("/admin/login")
  }

  return <AdminDashboard />
}
