import { createContext, useContext } from 'react'
import type { StudentProfileData, StudentProfilePatch } from '@/services/profile'

export interface StudentDataValue {
  profile: StudentProfileData | null
  status: 'loading' | 'ready' | 'missing' | 'error'
  error: string
  reload: () => void
  /** PATCHes the profile and updates provider state. Throws ApiError on failure. */
  saveProfile: (patch: StudentProfilePatch) => Promise<StudentProfileData>
}

export const StudentDataContext = createContext<StudentDataValue | null>(null)

export function useStudentData(): StudentDataValue {
  const value = useContext(StudentDataContext)
  if (!value) throw new Error('StudentDataProvider is required')
  return value
}

/** Returns null outside StudentDataProvider (e.g. public placement routes). */
export function useOptionalStudentData(): StudentDataValue | null {
  return useContext(StudentDataContext)
}
