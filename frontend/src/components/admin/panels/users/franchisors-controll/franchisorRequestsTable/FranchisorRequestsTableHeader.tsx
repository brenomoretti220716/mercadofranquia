export default function FranchisorRequestsTableHeader() {
  return (
    <div className="rounded-sm bg-[#E25E3E]">
      <div className="flex text-white">
        <div className="w-[15%] px-6 py-3 text-xs font-black">Nome/Empresa</div>
        <div className="w-[12%] px-6 py-3 text-xs text-center font-black">
          CNPJ
        </div>
        <div className="w-[15%] px-6 py-3 text-xs text-center font-black">
          Responsável
        </div>
        <div className="w-[18%] px-6 py-3 text-xs text-center font-black">
          Usuário
        </div>
        <div className="w-[12%] px-6 py-3 text-xs text-center font-black">
          Status
        </div>
        <div className="w-[13%] px-6 py-3 text-xs text-center font-black">
          Data
        </div>
        <div className="w-[15%] px-6 py-3 text-xs text-center font-black">
          Ações
        </div>
      </div>
    </div>
  )
}
