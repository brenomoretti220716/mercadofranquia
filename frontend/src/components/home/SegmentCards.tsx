'use client'

import AlertTriangleIcon from '../icons/alertTriangleIcon'
import HeartPulseIcon from '../icons/heartPulseIcon'
import ScissorsIcon from '../icons/scissorsIcon'
import TrendingDownIcon from '../icons/trendingDownIcon'
import TrendingUpIcon from '../icons/trendingUpIcon'
import UtensilsIcon from '../icons/utensilsIcon'

const segments = [
  {
    icon: UtensilsIcon,
    name: 'Alimentação',
    description:
      'Restaurantes, fast-food, cafeterias e franquias de comida saudável',
    rating: 4.6,
    growth: '+23%',
    rank: 1,
    badge: '🥇 #1 do Ano',
    isTop: true,
  },
  {
    icon: HeartPulseIcon,
    name: 'Saúde e Bem-estar',
    description: 'Clínicas, academias, spas e serviços de saúde preventiva',
    rating: 4.5,
    growth: '+18%',
    rank: 2,
    badge: '🥈 #2 do Ano',
    isTop: true,
  },
  {
    icon: ScissorsIcon,
    name: 'Beleza e Estética',
    description: 'Salões, barbearias, clínicas estéticas e cosméticos',
    rating: 4.3,
    growth: '+15%',
    rank: 3,
    badge: '🥉 #3 do Ano',
    isTop: true,
  },
  {
    icon: AlertTriangleIcon,
    name: 'Varejo de Moda',
    description:
      'Lojas de roupas e acessórios enfrentam desafios no mercado atual',
    rating: 2.8,
    growth: '-12%',
    rank: 89,
    badge: '⚠️ Pior do Ano',
    isTop: false,
  },
]

const SegmentPodiumCards = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Melhores e Piores Segmentos de 2024
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Análise completa dos setores que mais cresceram e os que enfrentaram
            desafios no último ano
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`bg-card rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                segment.isTop ? 'border-success/30' : 'border-destructive/30'
              }`}
            >
              {/* Badge */}
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  segment.isTop
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {segment.badge}
              </div>

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  segment.isTop ? 'bg-success/10' : 'bg-destructive/10'
                }`}
              >
                <segment.icon
                  className={`w-7 h-7 ${segment.isTop ? 'text-success' : 'text-destructive'}`}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2">
                {segment.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {segment.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">
                    {segment.rating}
                  </span>
                  <span className="text-yellow-500">★</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    segment.isTop ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {segment.isTop ? (
                    <TrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4" />
                  )}
                  {segment.growth}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SegmentPodiumCards
