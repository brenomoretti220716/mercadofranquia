'use client'

import Link from 'next/link'
import ArrowRightIcon from '../icons/arrowRightIcon'

const QuizBanner = () => {
  return (
    <section
      id="quiz-banner"
      className="relative overflow-hidden py-16 sm:py-24 bg-[#E8583B] bg-no-repeat"
      style={{
        backgroundImage:
          "url('/assets/LeftQuizBannerBG.png'), url('/assets/RightQuizBannerBG.png')",
        backgroundPosition: 'left center, right center',
        backgroundSize: 'auto 100%, auto 100%',
      }}
    >
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,max-content)_auto_minmax(0,1.2fr)] lg:gap-x-12 lg:gap-y-0">
          <div className="hidden lg:block" aria-hidden />

          <div className="text-center lg:max-w-xl lg:text-left lg:justify-self-start">
            <h2 className="text-3xl font-bold text-[hsl(240_24%_12%)] md:text-4xl lg:text-5xl leading-tight">
              Qual franquia combina com você?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[hsl(240_24%_12%)]/85 sm:text-lg max-w-xl mx-auto lg:mx-0">
              Responda nosso quiz interativo completo e descubra as melhores
              opções para o seu perfil de investidor.
            </p>
          </div>

          <div className="flex justify-center lg:justify-start lg:pl-0">
            <Link
              href="/quiz"
              className="bg-navy hover:bg-dark-bg text-white rounded-full px-7 sm:px-10 py-3 sm:py-3.5 text-base font-semibold shadow-glow flex items-center justify-center gap-2 transition-all w-full max-w-xs sm:w-auto sm:max-w-none whitespace-nowrap"
            >
              Fazer o Quiz Agora
              <ArrowRightIcon
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                color="white"
              />
            </Link>
          </div>

          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>
    </section>
  )
}

export default QuizBanner
