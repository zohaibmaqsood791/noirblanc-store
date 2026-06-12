import Link from "next/link";
import { redirect } from "next/navigation";

export default function AccountOrdersPage() {
  // Redirect to main account page — orders tab is there
  redirect("/account");
}
