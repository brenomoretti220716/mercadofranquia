export default function AbfSegmentsTableHeader() {
  return (
    <div className="rounded-sm bg-[#E25E3E] h-10">
      <div className="flex text-white">
        <div className="w-[10%] px-4 py-3 text-xs font-black">Ano</div>
        <div className="w-[10%] px-4 py-3 text-xs font-black">Trimestre</div>
        <div className="w-[15%] px-4 py-3 text-xs font-black text-center">
          Sigla
        </div>
        <div className="w-[45%] px-4 py-3 text-xs font-black">Segmento</div>
        <div className="w-[15%] px-4 py-3 text-xs font-black text-center">
          Valor (R$ MM)
        </div>
        <div className="w-[5%] px-4 py-3 text-xs font-black text-center">
          Ações
        </div>
      </div>
    </div>
  )
}
