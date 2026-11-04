import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '@/services/http'
import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfileData,
  type StudentProfilePatch,
} from '@/services/profile'
import { apiErrorMessage } from '@/services/types'
import { StudentDataContext, type StudentDataValue } from './useStudentData'

/** Profile data for the signed-in student, fetched once per layout mount. */
export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [status, setStatus] = useState<StudentDataValue['status']>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setStatus('loading')
    getStudentProfile()
      .then(data => {
        if (!live) return
        setProfile(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!live) return
        if (err instanceof ApiError && err.status === 404) {
          setStatus('missing')
        } else {
          setError(
            err instanceof ApiError
              ? apiErrorMessage(err.body, 'Your profile could not be loaded.')
              : 'Could not reach the server. Check your connection and try again.',
          )
          setStatus('error')
        }
      })
    return () => {
      live = false
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt(value => value + 1), [])

  const saveProfile = useCallback(async (patch: StudentProfilePatch) => {
    const updated = await updateStudentProfile(patch)
    setProfile(updated)
    setStatus('ready')
    return updated
  }, [])

  return (
    <StudentDataContext value={{ profile, status, error, reload, saveProfile }}>
      {children}
    </StudentDataContext>
  )
}
