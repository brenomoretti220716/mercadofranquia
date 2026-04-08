import Tooltip from '@/src/components/ui/Tooltip'

export default function FavoritesTableHeader() {
  return (
    <thead>
      <tr className="border-b border-border bg-secondary/50">
        <th className="text-left p-2 md:p-4 font-semibold text-foreground">
          #
        </th>
        <th className="text-left p-2 md:p-4 font-semibold text-foreground">
          <div className="flex items-center gap-2">
            <span>Franquia</span>
          </div>
        </th>
        <th
          scope="col"
          className="text-center p-4 font-semibold text-foreground hidden md:table-cell"
        >
          <div className="flex gap-2 items-center justify-center">
            <span>Segmento</span>
            <Tooltip content="Categoria de negócio da franquia (ex: Alimentação, Educação, Saúde)." />
          </div>
        </th>
        <th className="text-center p-2 md:p-4 font-semibold text-foreground">
          <div className="flex gap-2 items-center justify-center">
            <span>Avaliação</span>
            <Tooltip content="Média das avaliações dos usuários na página da franquia." />
          </div>
        </th>
        <th
          scope="col"
          className="text-center p-4 font-semibold text-foreground hidden md:table-cell"
        >
          <div className="flex gap-2 items-center justify-center">
            <span>Unidades</span>
            <Tooltip content="Quantidade total em operação no Brasil. Crescimento calculado nos últimos 30 dias." />
          </div>
        </th>
        <th
          scope="col"
          className="text-center p-4 font-semibold text-foreground hidden md:table-cell"
        >
          <div className="flex gap-2 items-center justify-center">
            <span>Investimento</span>
            <Tooltip content="Faixa estimada (taxa inicial, instalação, capital de giro)." />
          </div>
        </th>
      </tr>
    </thead>
  )
}
