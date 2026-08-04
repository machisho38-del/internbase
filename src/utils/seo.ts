import type { Context } from 'hono'
import type { Bindings } from '../types'

const FALLBACK_SITE_NAME = 'InternBase'

export type SeoMetadata = {
  title: string
  description: string
  path: string
  robots?: string
  type?: 'website' | 'article'
  image?: string | null
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] as string)
}

export function escapeXml(value: unknown): string {
  return escapeHtml(value)
}

export function stripMarkup(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateDescription(value: unknown, maxLength = 160): string {
  const text = stripMarkup(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

function validHttpOrigin(value: unknown): string | null {
  try {
    const url = new URL(String(value ?? '').trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.origin
  } catch {
    return null
  }
}

export function getPublicOrigin(c: Context<{ Bindings: Bindings }>): string {
  return validHttpOrigin(c.env.PUBLIC_SITE_URL) || new URL(c.req.url).origin
}

export function isPreviewDeployment(c: Context<{ Bindings: Bindings }>): boolean {
  return Boolean(c.env.CF_PAGES_BRANCH && c.env.CF_PAGES_BRANCH !== 'main')
}

export function absoluteUrl(origin: string, value: string): string {
  try {
    return new URL(value, `${origin}/`).toString()
  } catch {
    return `${origin}/`
  }
}

export function renderSeoTags(origin: string, metadata: SeoMetadata): string {
  const canonical = absoluteUrl(origin, metadata.path)
  const image = absoluteUrl(origin, metadata.image || '/og-default.png')
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const robots = escapeHtml(metadata.robots || 'index, follow')
  const type = escapeHtml(metadata.type || 'website')
  const structuredData = metadata.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')}</script>`
    : ''

  return `
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${FALLBACK_SITE_NAME}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  ${structuredData}`
}
