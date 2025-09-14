// app/admin/page.tsx
"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";


export default function AdminPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [msg, setMsg] = useState("");
const router = useRouter();


const login = async (e: React.FormEvent) => {
e.preventDefault();
setMsg("Entrando...");
const supabase = supabaseBrowser();
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) return setMsg("Falhou: " + error.message);
setMsg("Ok!");
router.push("/admin/relatorio");
};


return (
<main className="max-w-md mx-auto p-4 space-y-4">
<h1 className="text-2xl font-bold">Área Administrativa</h1>
<form onSubmit={login} className="space-y-3">
<input className="border rounded px-2 py-1 w-full" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="border rounded px-2 py-1 w-full" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
<button className="px-4 py-2 rounded bg-black text-white">Entrar</button>
{msg && <p className="text-sm">{msg}</p>}
</form>
</main>
);
}