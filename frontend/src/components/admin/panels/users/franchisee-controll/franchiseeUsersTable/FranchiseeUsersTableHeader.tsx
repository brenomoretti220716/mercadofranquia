export default function FranchiseeUsersTableHeader() {
  return (
    <div className="rounded-sm bg-[#E25E3E]">
      <div className="flex text-white">
        <div className="w-[20%] px-6 py-3 text-xs font-black">Nome</div>
        <div className="w-[20%] px-6 py-3 text-xs font-black">E-mail</div>
        <div className="w-[12%] px-6 py-3 text-xs text-center font-black">
          Cidade
        </div>
        <div className="w-[13%] px-6 py-3 text-xs text-center font-black">
          Nível de acesso
        </div>
        <div className="w-[15%] px-6 py-3 text-xs text-center font-black">
          Franquias
        </div>
        <div className="w-[8%] px-6 py-3 text-xs text-center font-black">
          Status
        </div>
        <div className="w-[12%] px-6 py-3 text-xs text-center font-black">
          Ações
        </div>
      </div>
    </div>
  )
}
