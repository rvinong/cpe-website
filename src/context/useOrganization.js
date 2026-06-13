import { useContext } from 'react'
import OrganizationContext from './organization-context'

function useOrganization() {
  const context = useContext(OrganizationContext)

  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }

  return context
}

export default useOrganization
