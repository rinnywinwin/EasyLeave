'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { Users, Briefcase, Shield } from 'lucide-react'

export default function HRPage() {
  const router = useRouter()
  const [hr, setHr] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmp, setNewEmp] = useState({ name: '', email: '', password: '', role: 'employee', department: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: hrUser } = await supabase.from('employees').select('*').eq('email', user.email).single()
    setHr(hrUser)
    const { data: emps } = await supabase.from('employees').select('*').order('name')
    setEmployees(emps || [])
  }

  async function handleAddEmployee(e: any) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    setAddSuccess('')

    const annualBalance = newEmp.role === 'employee' ? 8 : 14
    const sickBalance = 14

    const { error: authError } = await supabase.auth.signUp({
      email: newEmp.email,
      password: newEmp.password,
    })

    if (authError) {
      setAddError(authError.message)
      setAdding(false)
      return
    }

    const { error: empError } = await supabase.from('employees').insert({
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      department: newEmp.department,
      annual_leave_balance: annualBalance,
      sick_leave_balance: sickBalance,
    })

    if (empError) {
      setAddError(empError.message)
      setAdding(false)
      return
    }

    setAddSuccess(`${newEmp.name} has been added successfully!`)
    setNewEmp({ name: '', email: '', password: '', role: 'employee', department: '' })
    setAdding(false)
    setShowAddForm(false)
    await fetchData()
  }

  function startEdit(emp: any) {
    setEditing(emp.id)
    setEditValues({ annual_leave_balance: emp.annual_leave_balance, sick_leave_balance: emp.sick_leave_balance })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await supabase.from('employees').update({
      annual_leave_balance: Number(editValues.annual_leave_balance),
      sick_leave_balance: Number(editValues.sick_leave_balance),
    }).eq('id', id)
    setEditing(null)
    await fetchData()
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const roleColor: any = {
    employee: { bg: '#E8F0FB', color: '#185ABD' },
    manager: { bg: '#F0FDF4', color: '#15803D' },
    hr: { bg: '#FDF4FF', color: '#7E22CE' },
  }

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: <Users size={22} color="#185ABD" />, border: '#C7D9F5', color: '#0F172A' },
    { label: 'Managers', value: employees.filter(e => e.role === 'manager').length, icon: <Briefcase size={22} color="#15803D" />, border: '#BBF7D0', color: '#15803D' },
    { label: 'HR Admins', value: employees.filter(e => e.role === 'hr').length, icon: <Shield size={22} color="#7E22CE" />, border: '#E9D5FF', color: '#7E22CE' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '32px', height: '60px' }}>
        <img src="/logo.png" alt="EasyLeave" style={{ height: '90px', objectFit: 'contain' }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#185ABD' }}>HR Admin Portal</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7E22CE', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
            {hr?.name?.charAt(0) || 'H'}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{hr?.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>HR Admin</div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#64748B', background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Employee Management</h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Manage employee records and leave balances</p>
          </div>
          <button onClick={() => { setShowAddForm(!showAddForm); setAddError(''); setAddSuccess('') }} style={{
            background: '#185ABD', color: 'white', border: 'none', padding: '10px 20px',
            borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}>
            {showAddForm ? '✕ Cancel' : '+ Add Employee'}
          </button>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (
          <div style={{ background: 'white', border: '1px solid #C7D9F5', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 20px', color: '#185ABD' }}>➕ Add New Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
                  <input type="text" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="e.g. Ahmad Rizal" required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="e.g. ahmad@company.com" required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
                  <input type="password" value={newEmp.password} onChange={e => setNewEmp({ ...newEmp, password: e.target.value })} placeholder="Min 6 characters" required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Department</label>
                  <input type="text" value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} placeholder="e.g. Engineering"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Role</label>
                  <select value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', background: 'white', boxSizing: 'border-box' as const }}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Admin</option>
                  </select>
                </div>
              </div>

              {addError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                  {addError}
                </div>
              )}

              {addSuccess && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#15803D', marginBottom: '16px' }}>
                  ✅ {addSuccess}
                </div>
              )}

              <button type="submit" disabled={adding} style={{
                background: adding ? '#93C5FD' : '#185ABD', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                cursor: adding ? 'not-allowed' : 'pointer'
              }}>
                {adding ? 'Creating account...' : 'Create Employee Account'}
              </button>
            </form>
          </div>
        )}

        {addSuccess && !showAddForm && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#15803D', marginBottom: '20px' }}>
            ✅ {addSuccess}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'white', border: `1px solid ${s.border}`, borderRadius: '12px', padding: '20px' }}>
              <div style={{ marginBottom: '10px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Employee Table */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>All Employees</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Name', 'Email', 'Department', 'Role', 'Annual Leave', 'Sick Leave', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8F0FB', color: '#185ABD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                        {emp.name?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{emp.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>{emp.department || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: roleColor[emp.role]?.bg || '#F1F5F9',
                      color: roleColor[emp.role]?.color || '#64748B',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize'
                    }}>{emp.role}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {editing === emp.id ? (
                      <input type="number" value={editValues.annual_leave_balance}
                        onChange={e => setEditValues({ ...editValues, annual_leave_balance: e.target.value })}
                        style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #185ABD', fontSize: '13px' }} />
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#185ABD' }}>{emp.annual_leave_balance} days</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {editing === emp.id ? (
                      <input type="number" value={editValues.sick_leave_balance}
                        onChange={e => setEditValues({ ...editValues, sick_leave_balance: e.target.value })}
                        style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #185ABD', fontSize: '13px' }} />
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803D' }}>{emp.sick_leave_balance} days</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {editing === emp.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => saveEdit(emp.id)} disabled={saving} style={{ background: '#185ABD', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          {saving ? '...' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)} style={{ background: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(emp)} style={{ background: 'white', color: '#185ABD', border: '1px solid #C7D9F5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                        Edit Balance
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}