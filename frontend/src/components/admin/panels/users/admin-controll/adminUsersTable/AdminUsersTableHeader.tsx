export default function AdminUsersTableHeader() {
  return (
    <thead>
      <tr className="text-white font-bold">
        <th className="px-3 md:px-6 py-3 text-left rounded-l-sm bg-[#E25E3E] text-xs font-black">
          Nome
        </th>
        <th className="px-3 md:px-6 py-3 text-left bg-[#E25E3E] text-xs font-black">
          E-mail
        </th>
        <th className="px-3 md:px-6 py-3 text-center bg-[#E25E3E] text-xs font-black">
          Nível de acesso
        </th>
        <th className="px-3 md:px-6 py-3 text-center bg-[#E25E3E] text-xs font-black">
          Status
        </th>
        <th className="px-3 md:px-6 py-3 text-center rounded-r-sm bg-[#E25E3E] text-xs font-black">
          Detalhes
        </th>
      </tr>
    </thead>
  )
}
