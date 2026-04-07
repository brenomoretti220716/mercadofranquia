"use client"

const P = "#E8421A"

interface TabDef {
  id: string
  label: string
  count: number
  cor: string
}

interface Props {
  tabs: TabDef[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function TabsFluxo({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex gap-1.5 mb-5 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
          style={{
            background: activeTab === t.id ? P : "transparent",
            color: activeTab === t.id ? "#fff" : "#666",
            borderRadius: 8,
          }}
        >
          {t.label}{t.count > 0 ? ` (${t.count})` : ""}
        </button>
      ))}
    </div>
  )
}

export function StatusBadges({ stats }: { stats: Record<string, number> }) {
  return (
    <div className="flex items-center gap-2">
      {(stats.revisao || 0) > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF8E1", color: "#854F0B" }}>{stats.revisao} em revisao</span>}
      {(stats.aprovado || 0) > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#EBF5FF", color: "#2563EB" }}>{stats.aprovado} aprovados</span>}
      {(stats.publicado || 0) > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{stats.publicado} publicados</span>}
    </div>
  )
}
