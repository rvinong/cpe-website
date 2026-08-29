export const officerPositionOptions = [
  'President',
  'Vice President Internal',
  'Vice President External',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Auditor',
  'Assistant Auditor',
  'Business Manager',
  'P.I.O.',
  'Socio-Cultural Coordinator',
  'Sports Coordinator',
  'Academic Coordinator',
  '4th Year Representative',
  '3rd Year Representative',
  '2nd Year Representative',
  '1st Year Representative',
]

export const facultyPositionOptions = ['Program Chairperson', 'Faculty']

export const organizationPositionOptions = {
  officer: officerPositionOptions,
  faculty: facultyPositionOptions,
}

export const organizationPositionOrder = new Map(
  [...officerPositionOptions, ...facultyPositionOptions].map(
    (position, index) => [position.toLowerCase(), index],
  ),
)
