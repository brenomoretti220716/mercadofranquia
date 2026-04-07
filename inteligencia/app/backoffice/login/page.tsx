"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

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

    router.push("/backoffice")
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-dark.png" alt="Mercado Franquia" style={{ width: 200, margin: "0 auto" }} />
          <p className="text-sm mt-2" style={{ color: "#666666" }}>
            Intelligence Backoffice
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6"
          style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#666666" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={{ border: "1px solid #E5E5E5", borderRadius: 8, color: "#1A1A1A", background: "#F8F8F8" }}
              placeholder="admin@mercadofranquia.com.br"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#666666" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={{ border: "1px solid #E5E5E5", borderRadius: 8, color: "#1A1A1A", background: "#F8F8F8" }}
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-xs mb-4 text-center" style={{ color: "#E8421A" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: "#E8421A", borderRadius: 8, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#BBBBBB" }}>
          mercadofranquia.com.br
        </p>
      </div>
    </div>
  )
}
