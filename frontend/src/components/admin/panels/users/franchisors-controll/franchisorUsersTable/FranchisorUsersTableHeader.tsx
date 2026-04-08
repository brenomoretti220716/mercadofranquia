export default function FranchisorUsersTableHeader() {
  return (
    <div className="rounded-sm bg-[#E25E3E]">
      <div className="flex text-white">
        <div className="w-[25%] px-6 py-3 text-xs font-black">Nome</div>
        <div className="w-[25%] px-6 py-3 text-xs font-black">E-mail</div>
        <div className="w-[15%] px-6 py-3 text-xs text-center font-black">
          CPF/CNPJ
        </div>
        <div className="w-[25%] px-6 py-3 text-xs text-center font-black">
          Franquias
        </div>
        <div className="w-[10%] px-6 py-3 text-xs text-center font-black">
          Detalhes
        </div>
      </div>
    </div>
  )
}
