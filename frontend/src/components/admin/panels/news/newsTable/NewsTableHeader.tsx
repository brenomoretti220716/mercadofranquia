export default function NewsTableHeader() {
  return (
    <div className="rounded-sm bg-[#E25E3E]">
      <div className="flex text-white">
        <div className="w-[30%] px-4 py-3 text-xs font-black">Título</div>
        <div className="w-[20%] px-4 py-3 text-xs text-center font-black">
          Publicação
        </div>
        <div className="w-[20%] px-4 py-3 text-xs text-center font-black">
          Última Edição
        </div>
        <div className="w-[20%] px-4 py-3 text-xs text-center font-black">
          Categoria
        </div>
        <div className="w-[10%] px-4 py-3 text-xs text-center font-black">
          Detalhes
        </div>
      </div>
    </div>
  )
}
