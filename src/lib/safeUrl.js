const httpProtocols = new Set(['http:', 'https:'])

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasUnsafeControlCharacters(value) {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint < 0x20 || codePoint === 0x7f
  })
}

export function getSafeHttpUrl(value) {
  const rawValue = asTrimmedString(value)
  if (!rawValue || hasUnsafeControlCharacters(rawValue)) return ''

  try {
    const url = new URL(rawValue)
    return httpProtocols.has(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function getSafeAssetUrl(value) {
  const rawValue = asTrimmedString(value)
  if (!rawValue) return ''

  if (
    rawValue.startsWith('/') &&
    !rawValue.startsWith('//') &&
    !rawValue.includes('\\') &&
    !hasUnsafeControlCharacters(rawValue)
  ) {
    return rawValue
  }

  return getSafeHttpUrl(rawValue)
}

export function isSafeStoragePath(value) {
  const rawValue = asTrimmedString(value)

  return Boolean(
    rawValue &&
      !rawValue.startsWith('/') &&
      !rawValue.includes('\\') &&
      !hasUnsafeControlCharacters(rawValue) &&
      !rawValue.split('/').some((segment) => segment === '.' || segment === '..') &&
      !/^[a-z][a-z\d+.-]*:/i.test(rawValue),
  )
}

export function getSafeInternalPath(
  value,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
) {
  const rawValue = asTrimmedString(value)
  if (
    !rawValue.startsWith('/') ||
    rawValue.startsWith('//') ||
    rawValue.includes('\\') ||
    hasUnsafeControlCharacters(rawValue)
  ) {
    return ''
  }

  try {
    const url = new URL(rawValue, origin)
    if (url.origin !== origin) return ''
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return ''
  }
}
