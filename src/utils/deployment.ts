import type { Context } from 'hono'
import type { Bindings } from '../types'

const PRODUCTION_PAGES_HOST = 'internship-site.pages.dev'

function parseHostname(value: string): string | null {
  const candidate = value.trim().replace(/^"|"$/g, '')
  if (!candidate) return null

  try {
    // Forwarding headers normally contain host[:port], while accepting a URL here
    // also makes this helper safe to reuse with Request.url.
    return new URL(candidate.includes('://') ? candidate : `https://${candidate}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function isPreviewDeploymentFromHosts(hosts: string[], branch?: string): boolean {
  const hostnames = hosts
    .flatMap(value => value.split(','))
    .map(parseHostname)
    .filter((hostname): hostname is string => Boolean(hostname))

  // A proxy may retain the production host in one header while forwarding the
  // original Branch Preview host in another. Preview must win in that case.
  if (hostnames.some(hostname => hostname.endsWith(`.${PRODUCTION_PAGES_HOST}`))) return true
  if (hostnames.length > 0) return false

  // Cloudflare's branch variable is only reliable when no host was available.
  return Boolean(branch && branch !== 'main')
}

export function isPreviewDeployment(c: Context<{ Bindings: Bindings }>): boolean {
  return isPreviewDeploymentFromHosts([
    c.req.header('X-Forwarded-Host') || '',
    c.req.header('X-Original-Host') || '',
    c.req.header('Host') || '',
    c.req.url
  ], c.env.CF_PAGES_BRANCH)
}
