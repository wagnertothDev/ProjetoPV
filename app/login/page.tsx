// app/login/page.tsx
import { Suspense } from "react";
import LoginFormClient from "./_form";

export const dynamic = "force-dynamic";

function Loader() {
  return <main className="mx-auto max-w-md p-6">Carregando…</main>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginFormClient />
    </Suspense>
  );
}
