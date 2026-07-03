export const yearLevelOptions = [
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' },
  { value: 'Irregular', label: 'Irregular' },
]

export function getYearLevelLabel(value) {
  return (
    yearLevelOptions.find((option) => option.value === value)?.label ||
    'Not set'
  )
}
