import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getSafeAssetUrl,
  getSafeHttpUrl,
  getSafeInternalPath,
  isSafeStoragePath,
} from '../src/lib/safeUrl.js'

test('accepts only http and https external URLs', () => {
  assert.equal(getSafeHttpUrl('https://example.com/resource'), 'https://example.com/resource')
  assert.equal(getSafeHttpUrl('javascript:alert(1)'), '')
  assert.equal(getSafeHttpUrl('data:text/html,<h1>unsafe</h1>'), '')
  assert.equal(getSafeHttpUrl('//example.com/resource'), '')
})

test('keeps local assets and rejects ambiguous asset schemes', () => {
  assert.equal(getSafeAssetUrl('/images/logo.png'), '/images/logo.png')
  assert.equal(getSafeAssetUrl('//example.com/logo.png'), '')
  assert.equal(getSafeAssetUrl('javascript:alert(1)'), '')
})

test('allows storage paths without treating them as URLs', () => {
  assert.equal(isSafeStoragePath('profile/avatar.png'), true)
  assert.equal(isSafeStoragePath('javascript:alert(1)'), false)
  assert.equal(isSafeStoragePath('profile\\avatar.png'), false)
  assert.equal(isSafeStoragePath('../private.pdf'), false)
  assert.equal(isSafeStoragePath('profile/../private.pdf'), false)
})

test('only allows same-origin internal redirects', () => {
  const origin = 'https://cpe-website-two.vercel.app'

  assert.equal(
    getSafeInternalPath('/community?room=general#messages', origin),
    '/community?room=general#messages',
  )
  assert.equal(getSafeInternalPath('//example.com', origin), '')
  assert.equal(getSafeInternalPath('https://example.com', origin), '')
  assert.equal(getSafeInternalPath('/\\\\example.com', origin), '')
})
