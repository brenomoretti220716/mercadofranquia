import { ReactNode } from 'react'

interface FavoritesTableBodyProps {
  children: ReactNode
}

export default function FavoritesTableBody({
  children,
}: FavoritesTableBodyProps) {
  return <tbody>{children}</tbody>
}
