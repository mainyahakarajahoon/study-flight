import { useState } from 'react'
import { login, signup } from './store'
import { FIDSClock } from './FIDSBoard'

function GoldEmblem({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#F5A623" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#F5A623" strokeWidth="0.6" strokeOpacity="0.5" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize="18" fill="#F5A623">
        ✈
      </text>
    </svg>
  )
}

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = mode === 'signup' ? await signup(form) : await login(form)
      onAuth(user)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setBusy(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  return (
    <div className="min-h-screen bg-fids-bg text-fids-white font-fids flex flex-col">
      {/* top FIDS strip */}
      <div className="flex items-center justify-between border-b border-fids-amber/30 px-4 sm:px-6 py-3">
        <span className="text-fids-amber tracking-[0.3em] text-sm">FOCUS FLIGHT</span>
        <FIDSClock className="text-fids-amber text-lg" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <GoldEmblem />
          </div>
          <h1 className="text-fids-amber text-2xl sm:text-3xl tracking-[0.25em]">PASSPORT CONTROL</h1>
          <p className="text-fids-dim text-[11px] tracking-[0.3em] mt-2">
            {mode === 'signup' ? 'CREATE YOUR TRAVELLER PROFILE' : 'IDENTIFY YOURSELF TO CHECK IN'}
          </p>
        </div>

        <div className="w-full max-w-sm border border-fids-amber/40 bg-black/40">
          {/* tabs */}
          <div className="grid grid-cols-2 text-center text-xs tracking-[0.25em]">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`py-3 transition-colors ${
                  mode === m
                    ? 'bg-fids-amber/10 text-fids-amber border-b-2 border-fids-amber'
                    : 'text-fids-dim border-b border-white/10 hover:text-fids-white'
                }`}
              >
                {m === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-5 space-y-4">
            {mode === 'signup' && (
              <Field label="FULL NAME" value={form.name} onChange={set('name')} placeholder="ALEX MORGAN" autoFocus />
            )}
            <Field
              label="EMAIL"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoFocus={mode === 'login'}
            />
            <Field
              label="PASSWORD"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
            />

            {error && (
              <div className="text-red-400 text-xs tracking-wider border border-red-500/30 bg-red-500/5 px-3 py-2">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-fids-amber text-black tracking-[0.3em] font-bold hover:bg-fids-gold active:scale-[0.99] transition-all disabled:opacity-60 shadow-[0_0_25px_rgba(245,166,35,0.3)]"
            >
              {busy ? 'VERIFYING…' : mode === 'signup' ? 'CREATE & CHECK IN →' : 'CHECK IN →'}
            </button>
          </form>
        </div>

        <p className="text-fids-dim text-[10px] tracking-[0.25em] mt-6 max-w-sm text-center leading-relaxed">
          PROFILES ARE STORED PRIVATELY ON THIS DEVICE. YOUR FLIGHT LOG NEVER LEAVES YOUR BROWSER.
        </p>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-fids-dim text-[10px] tracking-[0.25em]">{label}</span>
      <input
        {...props}
        className="mt-1 w-full bg-black border border-white/20 px-3 py-2.5 font-fids text-fids-amber placeholder:text-fids-dim/60 outline-none focus:border-fids-amber transition-colors"
        required
      />
    </label>
  )
}
