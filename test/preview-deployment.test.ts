import assert from 'node:assert/strict'
import test from 'node:test'
import { isPreviewDeploymentFromHosts } from '../src/utils/deployment.ts'

test('the fixed Cloudflare Pages URL is production', () => {
  assert.equal(isPreviewDeploymentFromHosts(['internship-site.pages.dev'], 'feature'), false)
})

test('a Cloudflare Pages subdomain is preview', () => {
  assert.equal(isPreviewDeploymentFromHosts(['feature.internship-site.pages.dev'], 'main'), true)
})

test('preview wins when proxy headers contain both preview and production', () => {
  assert.equal(isPreviewDeploymentFromHosts([
    'internship-site.pages.dev',
    'branch.internship-site.pages.dev'
  ], 'main'), true)
})

test('forwarded host lists and ports are normalized', () => {
  assert.equal(isPreviewDeploymentFromHosts([
    'proxy.example.com, BRANCH.INTERNSHIP-SITE.PAGES.DEV:443'
  ]), true)
})

test('similar suffixes are not accepted as preview hosts', () => {
  assert.equal(isPreviewDeploymentFromHosts(['evilinternship-site.pages.dev']), false)
})

test('CF_PAGES_BRANCH is only a fallback when host information is absent', () => {
  assert.equal(isPreviewDeploymentFromHosts([], 'feature'), true)
  assert.equal(isPreviewDeploymentFromHosts([], 'main'), false)
  assert.equal(isPreviewDeploymentFromHosts(['custom.example.com'], 'feature'), false)
})
