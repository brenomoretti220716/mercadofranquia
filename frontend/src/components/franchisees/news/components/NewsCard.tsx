'use client'

import Image, { ImageProps } from 'next/image'
import Link, { LinkProps } from 'next/link'
import { ReactNode } from 'react'

import { getNewsImageUrl } from './newsImage'

interface NewsCardRootProps {
  as?: 'div' | 'article' | 'section'
  className?: string
  children: ReactNode
}

function Root({
  as: Component = 'article',
  className,
  children,
  variant,
}: NewsCardRootProps & {
  variant?: 'large' | 'medium' | 'small'
  tag?: string
}) {
  const variantClass = variant
    ? 'news-card cursor-pointer group h-full flex flex-col'
    : ''
  const combinedClassName = variant
    ? `${variantClass} ${className || ''}`
    : className

  return <Component className={combinedClassName}>{children}</Component>
}

interface NewsCardBodyProps {
  className?: string
  children: ReactNode
}

function Body({ className, children }: NewsCardBodyProps) {
  return <div className={className}>{children}</div>
}

interface NewsCardMetaProps {
  category?: string
  date?: string | Date | null
  className?: string
  categoryClassName?: string
  dateClassName?: string
  dateFormatter?: (value: string | Date | null | undefined) => string
}

function Meta({
  category,
  date,
  className,
  categoryClassName,
  dateClassName,
  dateFormatter = (value) => (value ? String(value) : ''),
}: NewsCardMetaProps) {
  if (!category && !date) {
    return null
  }

  return (
    <div className={className}>
      {category && <p className={categoryClassName}>{category}</p>}
      {date && <p className={dateClassName}>{dateFormatter(date)}</p>}
    </div>
  )
}

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

interface NewsCardTitleProps {
  as?: HeadingLevel
  className?: string
  children: ReactNode
  href?: string
  linkProps?: Omit<LinkProps, 'href'> & {
    target?: string
    rel?: string
    className?: string
  }
}

function Title({
  as: Component = 'h3',
  className,
  children,
  href,
  linkProps,
}: NewsCardTitleProps) {
  if (href) {
    return (
      <Component className={className}>
        <Link href={href} {...linkProps}>
          {children}
        </Link>
      </Component>
    )
  }

  return <Component className={className}>{children}</Component>
}

interface NewsCardSummaryProps {
  className?: string
  children: ReactNode
}

function Summary({ className, children }: NewsCardSummaryProps) {
  return <p className={className}>{children}</p>
}

interface NewsCardMediaProps {
  photoUrl?: string
  alt?: string
  href?: string
  linkProps?: Omit<LinkProps, 'href'> & {
    target?: string
    rel?: string
    className?: string
  }
  wrapperClassName?: string
  imageClassName?: string
  fallback?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: ImageProps['sizes']
}

function Media({
  photoUrl,
  alt = 'Notícia',
  href,
  linkProps,
  wrapperClassName,
  imageClassName,
  fallback,
  fill = false,
  width = 1000,
  height = 1000,
  priority = false,
  sizes,
}: NewsCardMediaProps) {
  const imageElement = (
    <Image
      src={getNewsImageUrl(photoUrl, fallback)}
      alt={alt}
      className={imageClassName}
      priority={priority}
      sizes={sizes}
      {...(fill
        ? { fill: true }
        : {
            width,
            height,
          })}
    />
  )

  const content = href ? (
    <Link href={href} {...linkProps}>
      {imageElement}
    </Link>
  ) : (
    imageElement
  )

  return <div className={wrapperClassName}>{content}</div>
}

interface NewsCardFooterProps {
  className?: string
  children: ReactNode
}

function Footer({ className, children }: NewsCardFooterProps) {
  return <div className={className}>{children}</div>
}

export const NewsCard = {
  Root,
  Body,
  Meta,
  Title,
  Summary,
  Media,
  Footer,
} as const

export type { NewsCardMediaProps, NewsCardMetaProps, NewsCardTitleProps }

export default NewsCard
