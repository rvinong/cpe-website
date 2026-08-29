export const internalAuditCategories = [
  {
    id: 'project_proposal',
    label: 'Project Proposals',
    shortLabel: 'Proposals',
    description:
      'Approved project proposals, implementation plans, objectives, and committee responsibilities.',
  },
  {
    id: 'accomplishment',
    label: 'Accomplishment Report',
    shortLabel: 'Accomplishments',
    description:
      'Records of completed programs, activities, initiatives, and organization outputs.',
  },
  {
    id: 'activity',
    label: 'Activities',
    shortLabel: 'Activities',
    description:
      'Records of completed programs, activities, initiatives and organization outputs.',
  },
  {
    id: 'liquidation',
    label: 'Liquidation Report',
    shortLabel: 'Liquidations',
    description:
      'Financial transparency records for event funds, expenses, receipts, and balances.',
  },
  {
    id: 'resolution',
    label: 'Resolutions',
    shortLabel: 'Resolutions',
    description:
      'Official decisions, approvals, policies, and actions documented by the organization.',
  },
]

export const internalAuditReports = [
  {
    id: 'sample-approved-project-proposal',
    type: 'project_proposal',
    title: 'Sample Approved Project Proposal',
    period: 'Proposal-based record',
    publishedAt: 'For publication',
    preparedBy: 'Project Committee',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample proposal record for objectives, implementation plan, expected outputs, timeline, and approval notes.',
    highlights: [
      'Project objectives and rationale',
      'Implementation timeline',
      'Approval and committee responsibilities',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-first-semester-accomplishment-report',
    type: 'accomplishment',
    title: 'Sample 1st Semester Accomplishment Report',
    period: 'AY 2026-2027, 1st Semester',
    publishedAt: 'For publication',
    preparedBy: 'Executive Committee',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample semester report format for completed programs, student participation, documentation notes, and follow-up actions.',
    highlights: [
      'Programs and activities completed',
      'Student participation summary',
      'Documentation and next-step notes',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-outreach-accomplishment-report',
    type: 'accomplishment',
    title: 'Sample Outreach Activity Accomplishment Report',
    period: 'Activity-based record',
    publishedAt: 'For publication',
    preparedBy: 'Project Lead',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample activity accomplishment record for objectives, outcomes, participants, and supporting documentation.',
    highlights: [
      'Objectives and actual outcomes',
      'Committee responsibilities',
      'Photos and evidence checklist',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-approved-activity-record',
    type: 'activity',
    title: 'Sample Approved Activity Record',
    period: 'Activity-based record',
    publishedAt: 'For publication',
    preparedBy: 'Activity Lead',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample activity record for approved events, implementation notes, attendance documentation, and public summary details.',
    highlights: [
      'Approved activity overview',
      'Event implementation notes',
      'Documentation and attendance summary',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-general-assembly-liquidation-report',
    type: 'liquidation',
    title: 'Sample General Assembly Liquidation Report',
    period: 'Event liquidation',
    publishedAt: 'For publication',
    preparedBy: 'Treasurer',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample financial report format for collected funds, documented expenses, receipts, and ending balance.',
    fundsReceived: 'TBA',
    totalExpenses: 'TBA',
    remainingBalance: 'TBA',
    highlights: [
      'Funds collected and source summary',
      'Expense breakdown with receipt references',
      'Remaining balance confirmation',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-workshop-liquidation-report',
    type: 'liquidation',
    title: 'Sample Workshop Materials Liquidation Report',
    period: 'Workshop liquidation',
    publishedAt: 'For publication',
    preparedBy: 'Treasurer',
    reviewedBy: 'Internal Auditor',
    status: 'Template',
    summary:
      'A sample liquidation record for workshop materials, supplies, reimbursements, and supporting proof.',
    fundsReceived: 'TBA',
    totalExpenses: 'TBA',
    remainingBalance: 'TBA',
    highlights: [
      'Materials and supplies list',
      'Receipt and reimbursement tracking',
      'Auditor review notes',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-resolution-01-series-2026',
    type: 'resolution',
    title: 'Sample Resolution No. 01, Series of 2026',
    period: 'Organization decision record',
    publishedAt: 'For publication',
    preparedBy: 'Secretary',
    reviewedBy: 'Executive Board',
    status: 'Template',
    summary:
      'A sample resolution format for approving the organization activity calendar and related implementation details.',
    resolutionNumber: 'Resolution No. 01, Series of 2026',
    highlights: [
      'Decision title and rationale',
      'Approval body and date',
      'Implementation instructions',
    ],
    fileUrl: '',
  },
  {
    id: 'sample-resolution-02-series-2026',
    type: 'resolution',
    title: 'Sample Resolution No. 02, Series of 2026',
    period: 'Organization decision record',
    publishedAt: 'For publication',
    preparedBy: 'Secretary',
    reviewedBy: 'Executive Board',
    status: 'Template',
    summary:
      'A sample resolution format for approving budget use, activity support, or official organization actions.',
    resolutionNumber: 'Resolution No. 02, Series of 2026',
    highlights: [
      'Budget or policy approval',
      'Voting and verification notes',
      'Publication-ready summary',
    ],
    fileUrl: '',
  },
]

export const internalAuditProcess = [
  {
    title: 'Prepare',
    description:
      'Assigned officers prepare the report, attach supporting records, and organize the document for review.',
  },
  {
    title: 'Review',
    description:
      'The internal auditor checks totals, documentation, completeness, and consistency before publication.',
  },
  {
    title: 'Verify',
    description:
      'Officers and advisers confirm the report is approved and safe to publish for student access.',
  },
  {
    title: 'Publish',
    description:
      'Approved records are posted in the archive so students can view the organization transparency files.',
  },
]
