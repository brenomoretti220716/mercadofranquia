'use client'

// Fake table component for blur effect when not authenticated
export default function FakeMercadoTable() {
  const fakeData = [
    {
      position: 1,
      name: 'Franquia Exemplo 1',
      segment: 'Alimentação',
      rating: 4.8,
      units: 150,
      investment: 'R$ 100k - 200k',
    },
    {
      position: 2,
      name: 'Franquia Exemplo 2',
      segment: 'Varejo',
      rating: 4.7,
      units: 200,
      investment: 'R$ 150k - 250k',
    },
    {
      position: 3,
      name: 'Franquia Exemplo 3',
      segment: 'Serviços',
      rating: 4.6,
      units: 120,
      investment: 'R$ 80k - 150k',
    },
    {
      position: 4,
      name: 'Franquia Exemplo 4',
      segment: 'Educação',
      rating: 4.5,
      units: 180,
      investment: 'R$ 200k - 300k',
    },
    {
      position: 5,
      name: 'Franquia Exemplo 5',
      segment: 'Saúde',
      rating: 4.4,
      units: 90,
      investment: 'R$ 120k - 180k',
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden filter blur-sm pointer-events-none">
      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[26%]" />
            <col className="w-[19%]" />
            <col className="w-[15%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left p-4 font-semibold text-foreground">#</th>
              <th className="text-left p-4 font-semibold text-foreground">
                Franquia
              </th>
              <th className="text-center p-4 font-semibold text-foreground">
                Segmento
              </th>
              <th className="text-center p-4 font-semibold text-foreground">
                Avaliação
              </th>
              <th className="text-center p-4 font-semibold text-foreground">
                Unidades
              </th>
              <th className="text-center p-4 font-semibold text-foreground">
                Investimento
              </th>
            </tr>
          </thead>
          <tbody>
            {fakeData.map((item) => (
              <tr
                key={item.position}
                className="border-b last:border-0 border-border hover:bg-secondary/30"
              >
                <td className="p-4">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base text-[#626D84] bg-[#E8EAEE]">
                    {item.position}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏢</span>
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center text-muted-foreground">
                  {item.segment}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                    <span className="font-semibold ml-1">{item.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-center text-foreground">
                  {item.units}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-block px-3 py-1 bg-primary/20 text-[#265973] rounded-full">
                    {item.investment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 space-y-4">
        {fakeData.map((item) => (
          <div
            key={item.position}
            className="border border-border rounded-lg p-4 bg-card"
          >
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#626D84] bg-[#E8EAEE] flex-shrink-0">
                {item.position}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h3 className="font-medium text-foreground text-sm">
                    {item.name}
                  </h3>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Segmento: {item.segment}</p>
                  <p>Avaliação: {item.rating} ⭐</p>
                  <p>Unidades: {item.units}</p>
                  <p>Investimento: {item.investment}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
