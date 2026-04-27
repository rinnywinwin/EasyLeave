'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: any) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('role')
      .eq('email', email)
      .single()

    if (emp?.role === 'manager') router.push('/manager')
    else if (emp?.role === 'hr') router.push('/hr')
    else router.push('/dashboard')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="EasyLeave" style={{ height: '200px', objectFit: 'contain' }} />
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI-Powered Leave Management</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', color: '#0F172A' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>Sign in to your account</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', boxSizing: 'border-box' as const }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', boxSizing: 'border-box' as const }}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: loading ? '#93C5FD' : '#185ABD',
              color: 'white', border: 'none', padding: '12px',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#185ABD', marginTop: '24px' }}>
          Developed by SW01084168 for Final Year Project
        </p>

      </div>
    </main>
  )
}