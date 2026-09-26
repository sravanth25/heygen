import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/server/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return <LoginForm />;
}
