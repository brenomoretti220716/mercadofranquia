"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const BG = "#f4f3ef"
const COR_PRIMARIA = "#1D9E75"
const COR_TEXTO = "#1a1a18"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Email ou senha incorretos.")
      return
    }

    router.push("/admin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: COR_PRIMARIA }}>
            Franquias Intelligence
          </p>
          <h1 className="text-xl font-medium" style={{ color: COR_TEXTO }}>
            Backoffice
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: "1px solid #e0dfda", color: COR_TEXTO, background: BG }}
              placeholder="admin@mercadofranquia.com.br"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: "1px solid #e0dfda", color: COR_TEXTO, background: BG }}
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-xs mb-4 text-center" style={{ color: "#E24B4A" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
            style={{ background: COR_PRIMARIA, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#ccc" }}>
          mercadofranquia.com.br
        </p>
      </div>
    </div>
  )
}
