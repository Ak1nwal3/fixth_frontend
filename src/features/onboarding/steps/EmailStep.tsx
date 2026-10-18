import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import AuthShell from '@/features/onboarding/components/AuthShell'
import NoteCallout from '@/features/onboarding/components/NoteCallout'
import PrimaryButton from '@/features/onboarding/components/PrimaryButton'
import ProgressSteps from '@/features/onboarding/components/ProgressSteps'
import TextField from '@/features/onboarding/components/TextField'
import type { EmailStepContent } from '@/features/onboarding/data'

interface EmailStepProps {
  content: EmailStepContent
}

/**
 * "Verify your email" step, shared by both tracks.
 *
 * Visual-only for now: the field holds local state so it behaves like a real
 * input, but submitting does not call an API yet.
 */
export default function EmailStep({ content }: EmailStepProps) {
  const [email, setEmail] = useState(content.fieldValue)

  return (
    <AuthShell brand={content.brand}>
      <form
        className="flex w-full max-w-[650px] flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <ProgressSteps total={content.steps} current={content.current} />

        <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-brand">
          {content.eyebrow}
        </p>

        <h1 className="font-display text-[24px] font-bold leading-[1.1] text-navy">{content.title}</h1>

        <p className="text-[13px] font-medium leading-[1.5] text-muted">{content.subtitle}</p>

        <TextField id="email" label={content.fieldLabel} value={email} onChange={setEmail} />

        <NoteCallout icon={<ShieldCheck className="size-3.5 shrink-0 text-brand" aria-hidden />}>
          {content.note}
        </NoteCallout>

        <div className="flex justify-end">
          <PrimaryButton type="submit" className="w-[210px]">
            {content.submit}
          </PrimaryButton>
        </div>
      </form>
    </AuthShell>
  )
}
