'use client'

import Image from 'next/image'
import RoundedButton from '../../ui/RoundedButton'

type LandingBannerProps = {
  button?: boolean
}

export default function LandingBanner({ button = true }: LandingBannerProps) {
  return (
    <div className="flex w-auto h-[40vh] md:h-[60vh] lg:h-[45vh] m-5 md:m-10 lg:m-10 rounded-2xl justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#041A48] opacity-30 z-10"></div>
      <Image
        src="/assets/banner.jpg"
        alt="Banner image"
        fill
        className="object-cover z-0 opacity-100"
      />
      <div className="text-center z-10 w-full p-2 md:p-5">
        <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl text-white mb-5 md:mb-5 lg:mb-10">
          O Portal Definitivo sobre Franquias no Brasil
        </h2>

        <h3 className="text-xl md:text-xl text-white">
          Notícias, análises e dados exclusivos para quem quer investir no
          mercado de franquias
        </h3>

        {button ? (
          <div className="mt-5 md:mt-10 lg:mt-20">
            <RoundedButton
              textColor="white"
              hoverTextColor="black"
              color="#E25E3E"
              hoverColor="white"
              text="Conheça o ranking 500"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
