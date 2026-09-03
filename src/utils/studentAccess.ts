export type StudentJobScope = 'public' | 'members' | 'unauthorized'

export function getAuthenticatedStudentId(student: any): number | null {
  const id = Number(student?.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function resolveStudentJobScope(student: any, membersOnly: boolean): StudentJobScope {
  if (!membersOnly) return 'public'
  return getAuthenticatedStudentId(student) ? 'members' : 'unauthorized'
}
