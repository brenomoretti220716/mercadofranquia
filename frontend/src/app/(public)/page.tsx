'use client'

import FeaturedFranchises from '@/src/components/home/FeaturedFranchises'
import Header from '../../components/header/Header'
import HeroSearch from '../../components/home/hero-search/HeroSearch'
import NewsSection from '../../components/home/NewsSection'
import ReviewsSection from '../../components/home/ReviewsSection'
import SegmentsSection from '../../components/home/SegmentsSection'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSearch />
        {/* <SegmentPodiumCards /> */}
        {/* <PromoBanner /> */}
        {/* <PodiumSection /> */}
        <FeaturedFranchises />
        <SegmentsSection />
        {/* <QuizBanner /> */}
        {/* <SearchBar /> */}
        <ReviewsSection />
        <NewsSection />
      </main>
    </div>
  )
}
