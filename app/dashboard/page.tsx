'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [page, setPage] = useState('dashboard')
  const [employee, setEmployee] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email)
      .single()
    setEmployee(emp)

    const { data: reqs } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', emp?.id)
      .order('created_at', { ascending: false })
    setRequests(reqs || [])
  }

  async function getAIRecommendation(leaveType: string, startDate: string, endDate: string, reason: string, balance: number) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const prompt = `You are an HR assistant. Analyze this leave request and give a short recommendation.
Employee leave request:
- Leave type: ${leaveType}
- Days requested: ${daysRequested}
- Reason: ${reason || 'No reason provided'}
- Current ${leaveType.toLowerCase()} leave balance: ${balance} days
Respond in ONE short sentence starting with either "Recommend: Approve" or "Recommend: Reject". Be concise.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      })
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Recommendation unavailable'
  }

  async function submitLeave(e: any) {
    e.preventDefault()
    setSubmitting(true)
    const form = e.target
    const leaveType = form.leave_type.value
    const startDate = form.start_date.value
    const endDate = form.end_date.value
    const reason = form.reason.value

    const balance = leaveType === 'Annual'
      ? employee?.annual_leave_balance
      : leaveType === 'Sick'
      ? employee?.sick_leave_balance
      : 999

    const recommendation = await getAIRecommendation(leaveType, startDate, endDate, reason, balance)

    await supabase.from('leave_requests').insert({
      employee_id: employee?.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: 'Pending',
      ai_recommendation: recommendation
    })

    await fetchData()
    setSubmitting(false)
    setPage('history')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '32px', height: '60px' }}>
        <img src="/logo.png" alt="EasyLeave" style={{ height: '90px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          {['dashboard', 'apply', 'history'].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: page === p ? '#E8F0FB' : 'transparent',
              color: page === p ? '#185ABD' : '#64748B',
              border: 'none', padding: '6px 16px', borderRadius: '6px',
              cursor: 'pointer', fontSize: '14px',
              fontWeight: page === p ? '600' : '400',
              textTransform: 'capitalize'
            }}>{p}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#185ABD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
            {employee?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{employee?.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'capitalize' }}>{employee?.role}</div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#64748B', background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>{getGreeting()}, {employee?.name} 👋</h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Here's your leave summary</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Annual Leave Left', value: `${employee?.annual_leave_balance} days`, icon: '🗓️' },
                { label: 'Sick Leave Left', value: `${employee?.sick_leave_balance} days`, icon: '🩺' },
                { label: 'Pending Requests', value: requests.filter(r => r.status === 'Pending').length, icon: '⏳' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', border: '1px solid #C7D9F5', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#0F172A' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Recent Requests</h2>
                <button onClick={() => setPage('history')} style={{ fontSize: '13px', color: '#185ABD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>View all →</button>
              </div>
              {requests.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{r.leave_type} Leave</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{r.start_date} → {r.end_date}</div>
                  </div>
                  <span style={{
                    background: r.status === 'Approved' ? '#F0FDF4' : r.status === 'Rejected' ? '#FEF2F2' : '#FFF7ED',
                    color: r.status === 'Approved' ? '#15803D' : r.status === 'Rejected' ? '#DC2626' : '#C2410C',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                  }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPLY */}
        {page === 'apply' && (
          <div style={{ maxWidth: '520px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Apply for Leave</h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Fill in the details below to submit your request</p>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '28px' }}>
              <form onSubmit={submitLeave}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Leave Type</label>
                  <select name="leave_type" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', background: 'white' }}>
                    {['Annual', 'Sick', 'Emergency', 'Unpaid'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
                  <input name="start_date" type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
                  <input name="end_date" type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Reason (optional)</label>
                  <textarea name="reason" rows={3} placeholder="Briefly describe your reason..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', resize: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <button type="submit" disabled={submitting} style={{
                  background: submitting ? '#93C5FD' : '#185ABD',
                  color: 'white', border: 'none', padding: '12px 24px',
                  borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  width: '100%', marginTop: '8px'
                }}>
                  {submitting ? '🤖 AI is reviewing your request...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {page === 'history' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Leave History</h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>All your submitted leave requests</p>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              {requests.length === 0 && (
                <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No leave requests yet.</p>
              )}
              {requests.map(r => (
                <div key={r.id} style={{ padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{r.leave_type} Leave</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{r.start_date} → {r.end_date}</div>
                    </div>
                    <span style={{
                      background: r.status === 'Approved' ? '#F0FDF4' : r.status === 'Rejected' ? '#FEF2F2' : '#FFF7ED',
                      color: r.status === 'Approved' ? '#15803D' : r.status === 'Rejected' ? '#DC2626' : '#C2410C',
                      padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                    }}>{r.status}</span>
                  </div>
                  {r.ai_recommendation && (
                    <div style={{ background: '#E8F0FB', border: '1px solid #C7D9F5', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#185ABD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🤖 <span>{r.ai_recommendation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}