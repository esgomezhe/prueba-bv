import { redirect } from "next/navigation";

/** La raíz redirige al dashboard; el proxy decide si exige login. */
export default function Home() {
  redirect("/dashboard");
}
