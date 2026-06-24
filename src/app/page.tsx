import { redirect } from "next/navigation";

/** The root just forwards to the dashboard; auth gating handles anonymous users. */
export default function Home() {
  redirect("/dashboard");
}
