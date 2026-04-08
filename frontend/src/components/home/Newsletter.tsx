'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      router.push(`/cadastro?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <section className="bg-dark-bg py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-semibold text-secondary mb-2">
              Receba novidades do mercado de franquias
            </h2>
            <p className="text-secondary/60 text-sm">
              Inscreva-se e receba as melhores oportunidades diretamente no seu
              e-mail.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
          >
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/10 border border-secondary/20 text-secondary placeholder:text-secondary/40 min-w-[240px] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
            <button
              type="submit"
              className="bg-primary hover:bg-coral-dark text-primary-foreground px-6 py-2 rounded-lg whitespace-nowrap font-medium transition-colors"
            >
              Inscrever
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
