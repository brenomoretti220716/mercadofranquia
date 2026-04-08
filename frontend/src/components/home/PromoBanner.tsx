'use client'

import SparklesIcon from '../icons/sparklesIcon'
import ArrowRightIcon from '../icons/arrowRightIcon'

const PromoBanner = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-coral-dark rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-white text-sm font-medium mb-4">
                <SparklesIcon className="w-4 h-4" color="white" />
                Oportunidade Especial
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Destaque sua Franquia no Ranking
              </h2>
              <p className="text-white/80 max-w-lg">
                Aumente a visibilidade da sua marca e atraia investidores
                qualificados. Planos especiais para franqueadores.
              </p>
            </div>

            <button className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-3 font-semibold shadow-lg flex items-center transition-colors">
              Anunciar Agora
              <ArrowRightIcon
                className="w-5 h-5 ml-2"
                color="hsl(10 79% 57%)"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
