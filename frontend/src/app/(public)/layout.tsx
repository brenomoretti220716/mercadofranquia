import Footer from '@/src/components/franchisees/footer/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
      <Footer />
    </div>
  )
}
