'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export default function ManagerPage() {
  const router = useRouter()
  const [manager, setManager] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: mgr } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email)
      .single()
    setManager(mgr)

    const { data: reqs } = await supabase
      .from('leave_requests')
      .select('*, employees(name, department)')
      .order('created_at', { ascending: false })
    setRequests(reqs || [])
  }

  async function updateStatus(id: string, status: 'Approved' | 'Rejected') {
    setUpdating(id)
    await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)
    await fetchData()
    setUpdating(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const pending = requests.filter(r => r.status === 'Pending')
  const processed = requests.filter(r => r.status !== 'Pending')

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '32px', height: '60px' }}>
        <img src="/logo.png" alt="EasyLeave" style={{ height: '90px', objectFit: 'contain' }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#185ABD' }}>Manager Portal</span>
<button onClick={() => router.push('/calendar')} style={{ fontSize: '13px', color: '#185ABD', background: '#E8F0FB', border: '1px solid #C7D9F5', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '500' }}>📅 Team Calendar</button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#185ABD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
            {manager?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{manager?.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Manager</div>
          </div>
          <button onClick={() => router.push('/calendar')} style={{ fontSize: '13px', color: '#185ABD', background: '#E8F0FB', border: '1px solid #C7D9F5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: '500' }}>📅 Calendar</button>
<button onClick={handleLogout} style={{ fontSize: '13px', color: '#64748B', background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Team Leave Requests</h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Review AI recommendations and approve or reject requests</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Pending Review', value: pending.length, icon: '⏳', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
            { label: 'Approved', value: requests.filter(r => r.status === 'Approved').length, icon: '✅', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'Rejected', value: requests.filter(r => r.status === 'Rejected').length, icon: '❌', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pending Requests */}
        {pending.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>⏳ Pending Review ({pending.length})</h2>
            {pending.map(r => (
              <div key={r.id} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{r.employees?.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{r.employees?.department} · {r.leave_type} Leave</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{r.start_date} → {r.end_date}</div>
                    {r.reason && <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>"{r.reason}"</div>}
                  </div>
                  <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>Pending</span>
                </div>

                {r.ai_recommendation && (
                  <div style={{ background: '#E8F0FB', border: '1px solid #C7D9F5', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#185ABD', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    🤖 <span>{r.ai_recommendation}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => updateStatus(r.id, 'Approved')} disabled={updating === r.id}
                    style={{ background: '#15803D', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {updating === r.id ? 'Updating...' : '✓ Approve'}
                  </button>
                  <button onClick={() => updateStatus(r.id, 'Rejected')} disabled={updating === r.id}
                    style={{ background: 'white', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processed Requests */}
        {processed.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>📋 Processed Requests</h2>
            {processed.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{r.employees?.name} · {r.leave_type} Leave</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{r.start_date} → {r.end_date}</div>
                </div>
                <span style={{
                  background: r.status === 'Approved' ? '#F0FDF4' : '#FEF2F2',
                  color: r.status === 'Approved' ? '#15803D' : '#DC2626',
                  padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {requests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '15px' }}>No leave requests yet</div>
          </div>
        )}

      </div>
    </main>
  )
}