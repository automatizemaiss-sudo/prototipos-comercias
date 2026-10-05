import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";

export const metadata = { title: "Admin — Silvia Marmitas" };

export default async function AdminPage() {
  const authed = (await cookies()).get(ADMIN_COOKIE)?.value === "1";
  return authed ? <Dashboard /> : <AdminLogin />;
}
