'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export default function CalendarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'my' | 'team'>('team')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/'); return }

    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('email', authUser.email)
      .single()
    setUser(emp)

    const { data: reqs } = await supabase
      .from('leave_requests')
      .select('*, employees(name, department)')
      .eq('status', 'Approved')
      .order('start_date')
    setRequests(reqs || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  function getLeavesForDay(day: number) {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return requests.filter(r => {
      if (view === 'my' && r.employee_id !== user?.id) return false
      return dateStr >= r.start_date && dateStr <= r.end_date
    })
  }

  const colors = ['#185ABD', '#15803D', '#7E22CE', '#C2410C', '#0891B2', '#BE185D']

  function getEmployeeColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '32px', height: '60px' }}>
        <img src="/logo.png" alt="EasyLeave" style={{ height: '90px', objectFit: 'contain' }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#185ABD' }}>Team Calendar</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#185ABD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#64748B', background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Team Calendar</h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>View approved leave across your team</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setView('my')} style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: view === 'my' ? '600' : '400',
                background: view === 'my' ? '#E8F0FB' : 'white',
                color: view === 'my' ? '#185ABD' : '#64748B',
                border: 'none', cursor: 'pointer'
              }}>My Leaves</button>
              <button onClick={() => setView('team')} style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: view === 'team' ? '600' : '400',
                background: view === 'team' ? '#E8F0FB' : 'white',
                color: view === 'team' ? '#185ABD' : '#64748B',
                border: 'none', cursor: 'pointer'
              }}>Team View</button>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}>← Prev</button>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{monthName}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}>Next →</button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748B', background: '#F8FAFC' }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, i) => {
              const leaves = day ? getLeavesForDay(day) : []
              return (
                <div key={i} style={{
                  minHeight: '90px', padding: '8px', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
                  background: day && isToday(day) ? '#EFF6FF' : 'white'
                }}>
                  {day && (
                    <>
                      <div style={{
                        fontSize: '13px', fontWeight: isToday(day) ? '700' : '400',
                        color: isToday(day) ? '#185ABD' : '#374151',
                        marginBottom: '4px'
                      }}>{day}</div>
                      {leaves.slice(0, 2).map((r, idx) => (
                        <div key={idx} style={{
                          background: getEmployeeColor(r.employees?.name || ''),
                          color: 'white', fontSize: '10px', fontWeight: '500',
                          padding: '2px 6px', borderRadius: '4px', marginBottom: '2px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {r.employees?.name?.split(' ')[0]}
                        </div>
                      ))}
                      {leaves.length > 2 && (
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>+{leaves.length - 2} more</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        {view === 'team' && requests.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 24px', marginTop: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 10px' }}>Team Members on Leave</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[...new Set(requests.map(r => r.employees?.name))].map(name => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getEmployeeColor(name || '') }}></div>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', marginTop: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
            <div style={{ fontSize: '14px' }}>No approved leaves to display</div>
          </div>
        )}

      </div>
    </main>
  )
}