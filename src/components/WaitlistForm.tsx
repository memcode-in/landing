import { FormEvent, useState } from 'react'
import { readUserFacingApiError, userFacingErrorMessage } from '../lib/user-facing-errors'
import SmoothInput from './SmoothInput'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface WaitlistPayload {
  name: string
  email: string
  role?: string
  company?: string
  message?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function WaitlistForm() {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    const form = e.currentTarget
    const data = new FormData(form)

    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const role = String(data.get('role') ?? '').trim()
    const company = String(data.get('company') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()

    if (!name) {
      setFormState('error')
      setErrorMessage('Please enter your name.')
      return
    }

    if (!email) {
      setFormState('error')
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!isValidEmail(email)) {
      setFormState('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    const payload: WaitlistPayload = { name, email }
    if (role) payload.role = role
    if (company) payload.company = company
    if (message) payload.message = message

    setFormState('submitting')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const details = await readUserFacingApiError(res, {
          fallback: "We couldn't join the waitlist right now. Please try again.",
        })
        throw new Error(details.message)
      }

      setFormState('success')
      form.reset()
    } catch (err) {
      setFormState('error')
      setErrorMessage(
        userFacingErrorMessage(err, "We couldn't join the waitlist right now. Please try again."),
      )
    }
  }

  return (
    <section id="waitlist" className="waitlist">
      <div className="container">
        <div className="waitlist__card animate-fade-up">
          <div className="section-header section-header--center">
            <h2 className="section-header__title">Join the waitlist</h2>
            <p className="section-header__subtitle">
              Be the first to know when memCode launches. Early access for waitlist members.
            </p>
          </div>

          {formState === 'success' ? (
            <div className="waitlist__success" role="status">
              <span className="waitlist__success-icon">✓</span>
              <p>You&apos;re on the list! We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form className="waitlist__form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="name">Name *</label>
                  <SmoothInput
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Developer"
                    disabled={formState === 'submitting'}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <SmoothInput
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="jane@company.com"
                    disabled={formState === 'submitting'}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="role">Role</label>
                  <select id="role" name="role" disabled={formState === 'submitting'}>
                    <option value="">Select role</option>
                    <option value="Developer">Developer</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Founder">Founder</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="company">Company</label>
                  <SmoothInput
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Acme Inc."
                    disabled={formState === 'submitting'}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us what you're building…"
                  disabled={formState === 'submitting'}
                />
              </div>

              {formState === 'error' && (
                <p className="waitlist__error" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={formState === 'submitting'}
              >
                {formState === 'submitting' ? 'Submitting…' : 'Join Waitlist'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
