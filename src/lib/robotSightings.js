function shuffle(values) {
  const shuffledValues = [...values]

  for (let index = shuffledValues.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentValue = shuffledValues[index]

    shuffledValues[index] = shuffledValues[randomIndex]
    shuffledValues[randomIndex] = currentValue
  }

  return shuffledValues
}

export const robotVariants = [
  'scout',
  'circuit',
  'orbit',
  'archive',
  'tread',
  'chat',
  'signal',
  'booster',
  'sleep',
  'prism',
]

export function getRandomRobotAssignments(
  cardCount,
  variants = robotVariants,
) {
  const safeCardCount = Number.isFinite(cardCount)
    ? Math.max(0, Math.floor(cardCount))
    : 0
  const availableVariants = Array.isArray(variants)
    ? variants.filter(Boolean)
    : []

  if (safeCardCount === 0 || availableVariants.length === 0) return []

  const cardIndexes = shuffle(
    Array.from({ length: safeCardCount }, (_, index) => index),
  )
  const selectedVariants = shuffle(availableVariants).slice(0, safeCardCount)
  const assignments = Array.from({ length: safeCardCount }, () => '')

  selectedVariants.forEach((variant, index) => {
    assignments[cardIndexes[index]] = variant
  })

  return assignments
}
