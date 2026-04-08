'use client'

import NewsPanel from '@/src/components/franchisees/news/panel/NewsPanel'
import Header from '@/src/components/header/Header'

export default function News() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <NewsPanel />
      </main>
    </div>
  )
}
