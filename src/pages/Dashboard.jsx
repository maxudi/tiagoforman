import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Status config ────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending:     { label: 'Aguardando',     color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed:   { label: 'Confirmado',     color: 'bg-blue-500/20 text-blue-400'   },
  in_progress: { label: 'Em atendimento', color: 'bg-purple-500/20 text-purple-400'},
  completed:   { label: 'Finalizado',     color: 'bg-green-500/20 text-green-400' },
  cancelled:   { label: 'Cancelado',      color: 'bg-red-500/20 text-red-400'     },
}
const dotColor = (s) => ({
  pending:'bg-yellow-500', confirmed:'bg-blue-500', in_progress:'bg-purple-500',
  completed:'bg-green-500', cancelled:'bg-red-500'
}[s] || 'bg-gray-500')

export default function Dashboard() {
  const { userProfile } = useAuth()

  // ── Stats ─────────────────────────────────────────────────────────
  const [statsData, setStatsData] = useState({ today:0, month:0, revenue:0, rating:null })

  // ── Pausar sistema ─────────────────────────────────────────────────
  const [isPaused, setIsPaused] = useState(false)
  const [savingPause, setSavingPause] = useState(false)

  // ── Atendentes ─────────────────────────────────────────────────────
  const [barbers, setBarbers] = useState([])

  // ── Aniversariantes ────────────────────────────────────────────────
  const [birthdays, setBirthdays] = useState([])

  // ── Calendário ─────────────────────────────────────────────────────
  const todayDate = new Date()
  const [calMonth, setCalMonth] = useState(todayDate.getMonth())
  const [calYear,  setCalYear]  = useState(todayDate.getFullYear())
  const [calAppointments, setCalAppointments] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  // ── Modais ─────────────────────────────────────────────────────────
  const [showAppModal,    setShowAppModal]    = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showAvailModal,  setShowAvailModal]  = useState(false)
  const [showBdayModal,   setShowBdayModal]   = useState(false)
  const [showDayModal,    setShowDayModal]    = useState(false)

  // ── Novo agendamento form ──────────────────────────────────────────
  const [customers,      setCustomers]      = useState([])
  const [barberServices, setBarberServices] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots,   setLoadingSlots]   = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer]         = useState({ first_name:'', phone:'' })
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [appForm, setAppForm] = useState({
    customer_id:'', barber_id:'', service_id:'', scheduled_date:'', scheduled_time:''
  })
  const [savingApp, setSavingApp] = useState(false)

  // ── Novo cliente form ──────────────────────────────────────────────
  const [clientForm, setClientForm] = useState({
    first_name:'', last_name:'', phone:'', email:'', date_of_birth:'', notes:''
  })
  const [savingClient, setSavingClient] = useState(false)

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  // ════════════════════════════════════════════════════════════════════
  // Data fetching
  // ════════════════════════════════════════════════════════════════════

  const fetchStats = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const orgId = userProfile.organization_id
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const y = now.getFullYear(), m = now.getMonth() + 1
    const monthStart = `${y}-${String(m).padStart(2,'0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const monthEnd = `${y}-${String(m).padStart(2,'0')}-${lastDay}`

    const [todayR, monthR, revenueR, ratingR] = await Promise.all([
      supabase.from('appointments').select('id', {count:'exact',head:true})
        .eq('organization_id', orgId).eq('scheduled_date', todayStr),
      supabase.from('appointments').select('id', {count:'exact',head:true})
        .eq('organization_id', orgId).gte('scheduled_date', monthStart).lte('scheduled_date', monthEnd),
      supabase.from('appointments').select('total_amount, service_price')
        .eq('organization_id', orgId).eq('status','completed')
        .gte('scheduled_date', monthStart).lte('scheduled_date', monthEnd),
      supabase.from('reviews').select('rating')
        .eq('organization_id', orgId).eq('is_visible', true),
    ])

    const revenue = (revenueR.data || []).reduce((s, a) =>
      s + (parseFloat(a.total_amount) || parseFloat(a.service_price) || 0), 0)
    const ratings = (ratingR.data || []).map(r => r.rating)
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : null

    setStatsData({ today: todayR.count || 0, month: monthR.count || 0, revenue, rating: avgRating })
  }, [userProfile])

  const fetchPauseStatus = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const { data } = await supabase.from('organizations').select('appointments_paused')
      .eq('id', userProfile.organization_id).single()
    setIsPaused(data?.appointments_paused === true)
  }, [userProfile])

  const fetchBarbers = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const { data } = await supabase.from('barbers')
      .select('id, first_name, last_name, is_available, commission_rate')
      .eq('organization_id', userProfile.organization_id)
      .eq('is_active', true).order('first_name')
    setBarbers(data || [])
  }, [userProfile])

  const fetchBirthdays = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2,'0')
    const dd = String(now.getDate()).padStart(2,'0')
    const { data } = await supabase.from('customers')
      .select('id, first_name, last_name, phone, date_of_birth')
      .eq('organization_id', userProfile.organization_id)
      .eq('is_active', true).not('date_of_birth','is',null)
    setBirthdays((data || []).filter(c => {
      if (!c.date_of_birth) return false
      const [, m, d] = c.date_of_birth.split('-')
      return m === mm && d === dd
    }))
  }, [userProfile])

  const fetchCalendarAppointments = useCallback(async (month, year) => {
    if (!userProfile?.organization_id) return
    const lastDay = new Date(year, month + 1, 0).getDate()
    const start = `${year}-${String(month + 1).padStart(2,'0')}-01`
    const end   = `${year}-${String(month + 1).padStart(2,'0')}-${lastDay}`
    const { data } = await supabase.from('appointments')
      .select(`id, scheduled_date, scheduled_time, status,
        customer:customers(first_name, last_name),
        service:services(name),
        barber:barbers(first_name, last_name)`)
      .eq('organization_id', userProfile.organization_id)
      .gte('scheduled_date', start).lte('scheduled_date', end)
      .order('scheduled_time', { ascending: true })
    setCalAppointments(data || [])
  }, [userProfile])

  const fetchCustomers = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const { data } = await supabase.from('customers')
      .select('id, first_name, last_name, phone')
      .eq('organization_id', userProfile.organization_id).order('first_name')
    setCustomers(data || [])
  }, [userProfile])

  const fetchBarberServicesForForm = async (barberId) => {
    if (!barberId) { setBarberServices([]); return }
    const { data } = await supabase.from('barber_services')
      .select('service_id, custom_price, custom_duration_minutes, service:services(id, name, duration_minutes, price)')
      .eq('barber_id', barberId)
    setBarberServices((data || []).map(bs => ({
      id: bs.service.id, name: bs.service.name,
      duration_minutes: bs.custom_duration_minutes || bs.service.duration_minutes,
      price: bs.custom_price || bs.service.price,
    })))
  }

  const fetchSlots = useCallback(async () => {
    const { barber_id, scheduled_date, service_id } = appForm
    if (!barber_id || !scheduled_date || !service_id) { setAvailableSlots([]); return }
    const sel = barberServices.find(s => s.id === service_id)
    if (!sel) { setAvailableSlots([]); return }
    setLoadingSlots(true)
    try {
      const duration = sel.duration_minutes || 30
      const slotsNeeded = Math.ceil(duration / 30)
      const dow7 = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const dowStr = dow7[new Date(scheduled_date + 'T00:00:00').getDay()]

      // 1. Fetch all barber schedules and filter in JS (same as Agendamentos.jsx)
      const { data: barberSchedulesData, error: schedErr } = await supabase
        .from('barber_schedules')
        .select('id, barber_id, schedule_id, schedules(id, start_time, end_time, day_of_week, is_active)')
        .eq('barber_id', barber_id)

      if (schedErr) throw schedErr

      const schedulesForDay = (barberSchedulesData || [])
        .map(bs => bs.schedules)
        .filter(s => s?.day_of_week === dowStr && s?.is_active === true)

      if (!schedulesForDay.length) { setAvailableSlots([]); return }

      // 2. Generate all 30-min slots from each schedule
      const allSlots = []
      schedulesForDay.forEach(schedule => {
        const [startH, startM] = schedule.start_time.split(':').map(Number)
        const [endH, endM]     = schedule.end_time.split(':').map(Number)
        let h = startH, m = startM
        while (h < endH || (h === endH && m < endM)) {
          allSlots.push({ time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, booked: false })
          m += 30
          if (m >= 60) { m -= 60; h++ }
        }
      })

      // 3. Fetch booked appointments and mark occupied slots
      const { data: bookedApts } = await supabase
        .from('appointments')
        .select('scheduled_time, service:services(duration_minutes)')
        .eq('barber_id', barber_id)
        .eq('scheduled_date', scheduled_date)
        .neq('status', 'cancelled')

      ;(bookedApts || []).forEach(apt => {
        const aptDuration = apt.service?.duration_minutes || 30
        const occupied = Math.ceil(aptDuration / 30)
        const startFmt = apt.scheduled_time?.substring(0, 5)
        const startIdx = allSlots.findIndex(s => s.time === startFmt)
        if (startIdx !== -1) {
          for (let i = 0; i < occupied && startIdx + i < allSlots.length; i++) {
            allSlots[startIdx + i].booked = true
          }
        }
      })

      // 4. Filter slots with enough consecutive free space
      const available = allSlots.filter((_, idx) => {
        for (let i = 0; i < slotsNeeded; i++) {
          if (!allSlots[idx + i] || allSlots[idx + i].booked) return false
        }
        return true
      })

      setAvailableSlots(available.map(s => s.time))
    } catch { setAvailableSlots([]) }
    finally { setLoadingSlots(false) }
  }, [appForm, barberServices])

  // ════════════════════════════════════════════════════════════════════
  // Effects
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchStats(); fetchPauseStatus(); fetchBarbers(); fetchBirthdays()
    }
  }, [userProfile, fetchStats, fetchPauseStatus, fetchBarbers, fetchBirthdays])

  useEffect(() => { fetchCalendarAppointments(calMonth, calYear) },
    [calMonth, calYear, fetchCalendarAppointments])

  useEffect(() => { if (showAppModal) fetchCustomers() }, [showAppModal, fetchCustomers])

  useEffect(() => { fetchBarberServicesForForm(appForm.barber_id) }, [appForm.barber_id])

  useEffect(() => { fetchSlots() },
    [appForm.barber_id, appForm.scheduled_date, appForm.service_id, fetchSlots])

  // ════════════════════════════════════════════════════════════════════
  // Handlers
  // ════════════════════════════════════════════════════════════════════
  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(day)
    setShowDayModal(true)
  }

  const handleTogglePause = async () => {
    setSavingPause(true)
    try {
      const { error } = await supabase.from('organizations')
        .update({ appointments_paused: !isPaused })
        .eq('id', userProfile.organization_id)
      if (error) throw error
      setIsPaused(!isPaused)
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setSavingPause(false) }
  }

  const handleToggleBarberAvail = async (b) => {
    const nv = !b.is_available
    const { error } = await supabase.from('barbers').update({ is_available: nv }).eq('id', b.id)
    if (!error) setBarbers(prev => prev.map(x => x.id === b.id ? { ...x, is_available: nv } : x))
  }

  const handleCreateQuickCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) { alert('Preencha nome e telefone'); return }
    setCreatingCustomer(true)
    try {
      const { data, error } = await supabase.from('customers').insert({
        organization_id: userProfile.organization_id,
        first_name: newCustomer.first_name, last_name: '',
        phone: newCustomer.phone.replace(/\D/g,''), email: ''
      }).select().single()
      if (error) throw error
      setCustomers(prev => [...prev, data])
      setAppForm(p => ({ ...p, customer_id: data.id }))
      setNewCustomer({ first_name:'', phone:'' }); setShowNewCustomer(false)
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setCreatingCustomer(false) }
  }

  const handleCreateAppointment = async (e) => {
    e.preventDefault()
    if (isPaused) {
      alert('⚠️ O sistema de agendamentos está pausado. Retome o sistema antes de criar novos agendamentos.'); return
    }
    const { customer_id, barber_id, service_id, scheduled_date, scheduled_time } = appForm
    if (!customer_id || !barber_id || !service_id || !scheduled_date || !scheduled_time) {
      alert('Preencha todos os campos obrigatórios'); return
    }
    setSavingApp(true)
    try {
      const sel = barberServices.find(s => s.id === service_id)
      const [h, m] = scheduled_time.split(':').map(Number)
      const em = h*60 + m + (sel?.duration_minutes || 30)
      const scheduled_end_time = `${String(Math.floor(em/60)).padStart(2,'0')}:${String(em%60).padStart(2,'0')}:00`
      const { error } = await supabase.from('appointments').insert({
        organization_id: userProfile.organization_id,
        customer_id, barber_id, service_id, scheduled_date,
        scheduled_time: scheduled_time + ':00', scheduled_end_time,
        status: 'pending', service_price: sel?.price || 0, total_amount: sel?.price || 0
      })
      if (error) throw error
      setShowAppModal(false); setShowNewCustomer(false)
      setAppForm({ customer_id:'', barber_id:'', service_id:'', scheduled_date:'', scheduled_time:'' })
      setBarberServices([])
      fetchStats(); fetchCalendarAppointments(calMonth, calYear)
      alert('Agendamento criado com sucesso!')
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setSavingApp(false) }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    if (!clientForm.first_name || !clientForm.phone) { alert('Nome e telefone são obrigatórios'); return }
    setSavingClient(true)
    try {
      const { error } = await supabase.from('customers').insert({
        organization_id: userProfile.organization_id,
        first_name: clientForm.first_name, last_name: clientForm.last_name || '',
        phone: clientForm.phone.replace(/\D/g,''), email: clientForm.email || '',
        date_of_birth: clientForm.date_of_birth || null, notes: clientForm.notes || ''
      })
      if (error) throw error
      setShowClientModal(false)
      setClientForm({ first_name:'', last_name:'', phone:'', email:'', date_of_birth:'', notes:'' })
      fetchBirthdays()
      alert('Cliente cadastrado com sucesso!')
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setSavingClient(false) }
  }

  // ── Calendar helpers ──────────────────────────────────────────────
  const generateCalendar = () => {
    const firstDay = new Date(calYear, calMonth, 1)
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }
  const getAptsForDay = (day) => {
    if (!day) return []
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return calAppointments.filter(a => a.scheduled_date === ds)
  }
  const isTodayFn = (day) =>
    day === todayDate.getDate() && calMonth === todayDate.getMonth() && calYear === todayDate.getFullYear()

  const navCalendar = (dir) => {
    let m = calMonth + dir, y = calYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalMonth(m); setCalYear(y)
  }

  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  const days = generateCalendar()

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {userProfile?.first_name}!
        </h1>
        <p className="text-gray-400">Visão geral do seu negócio</p>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Agendamentos Hoje', value: statsData.today, icon: '📅', color: 'from-blue-500 to-blue-600' },
          { label: 'Agendamentos Mês', value: statsData.month, icon: '📊', color: 'from-indigo-500 to-indigo-600' },
          { label: 'Receita do Mês', value: `R$ ${statsData.revenue.toFixed(2)}`, icon: '💰', color: 'from-amber-500 to-yellow-500' },
          {
            label: 'Avaliação Média',
            value: statsData.rating ? `${statsData.rating} ★` : '—',
            icon: '⭐', color: 'from-purple-500 to-purple-600',
            sub: statsData.rating ? null : 'Nenhuma avaliação ainda'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-white text-2xl font-bold">{stat.value}</p>
            {stat.sub && <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Ações Rápidas ────────────────────────────────────────────── */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

          <button
            onClick={() => {
              if (isPaused) { alert('⚠️ O sistema de agendamentos está pausado. Retome o sistema antes de criar novos agendamentos.'); return }
              setShowAppModal(true)
            }}
            className={`flex items-center gap-3 p-4 rounded-lg transition-colors text-left relative ${
              isPaused ? 'bg-gray-800/30 opacity-50 cursor-not-allowed' : 'bg-gray-800/50 hover:bg-gray-800'
            }`}>
            <span className="text-2xl">{isPaused ? '🚫' : '➕'}</span>
            <div>
              <p className="text-white font-medium">Novo Agendamento</p>
              <p className={`text-sm ${isPaused ? 'text-red-400' : 'text-gray-400'}`}>
                {isPaused ? 'Sistema pausado' : 'Criar agendamento'}
              </p>
            </div>
          </button>

          <button onClick={() => setShowClientModal(true)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-white font-medium">Novo Cliente</p>
              <p className="text-gray-400 text-sm">Cadastrar cliente</p>
            </div>
          </button>

          <button onClick={handleTogglePause} disabled={savingPause}
            className={`flex items-center gap-3 p-4 rounded-lg transition-all text-left relative border-2 disabled:opacity-60 ${
              isPaused
                ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50'
                : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50'
            }`}>
            <span className="text-2xl">{isPaused ? '⏸️' : '▶️'}</span>
            <div>
              <p className="text-white font-medium">{isPaused ? 'Agend. Pausados' : 'Pausar Agendamentos'}</p>
              <p className={`text-sm ${isPaused ? 'text-red-300' : 'text-green-300'}`}>
                {isPaused ? 'Clique para retomar' : 'Sistema ativo'}
              </p>
            </div>
            <div className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
          </button>

          <button onClick={() => setShowAvailModal(true)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-white font-medium">Disponibilidade</p>
              <p className="text-gray-400 text-sm">
                {barbers.filter(b => b.is_available).length}/{barbers.length} atendentes
              </p>
            </div>
          </button>

          <button onClick={() => setShowBdayModal(true)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left relative">
            <span className="text-2xl">🎂</span>
            <div>
              <p className="text-white font-medium">Aniversariantes</p>
              <p className="text-gray-400 text-sm">{birthdays.length} hoje</p>
            </div>
            {birthdays.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {birthdays.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Banner pausado ────────────────────────────────────────────── */}
      {isPaused && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-300 font-semibold">Sistema de agendamentos pausado</p>
            <p className="text-red-400/70 text-sm">Novos agendamentos estão bloqueados. Clique em "Agend. Pausados" para retomar.</p>
          </div>
        </div>
      )}

      {/* ── Calendário ───────────────────────────────────────────────── */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{monthNames[calMonth]} {calYear}</h2>
          <div className="flex gap-2">
            <button onClick={() => navCalendar(-1)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
              ← Anterior
            </button>
            <button
              onClick={() => { setCalMonth(todayDate.getMonth()); setCalYear(todayDate.getFullYear()) }}
              className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 text-white rounded-lg transition-colors text-sm">
              Hoje
            </button>
            <button onClick={() => navCalendar(1)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Próximo →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-sm font-semibold text-gray-400 py-2 bg-gray-800/30 rounded-t">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const apts = getAptsForDay(day)
            const isToday = day ? isTodayFn(day) : false
            return (
              <div key={i}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] rounded-lg p-2 transition-all
                  ${!day ? 'invisible' : 'cursor-pointer'}
                  ${isToday
                    ? 'bg-amber-500/10 border-2 border-amber-500'
                    : 'bg-gray-800/30 border border-gray-700 hover:bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                {day && (
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-amber-400' : 'text-gray-300'}`}>
                      {day}
                    </span>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {apts.slice(0, 3).map((a, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(a.status)}`} />
                          <span className="text-[10px] text-gray-300 truncate">
                            {a.scheduled_time?.slice(0, 5)} {a.service?.name || ''}
                          </span>
                        </div>
                      ))}
                      {apts.length > 3 && (
                        <p className="text-[10px] text-gray-500">+{apts.length - 3} mais</p>
                      )}
                    </div>
                    {apts.length > 0 && (
                      <div className="mt-1">
                        <span className="text-[10px] font-semibold text-gray-400">{apts.length} agend.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-800">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor(k)}`} />
              <span className="text-xs text-gray-400">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAIS
      ══════════════════════════════════════════════════════════════ */}

      {/* ── Novo Agendamento ─────────────────────────────────────────── */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-white">Novo Agendamento</h2>
              <button onClick={() => { setShowAppModal(false); setShowNewCustomer(false) }}
                className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-5">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Cliente *</label>
                {!showNewCustomer ? (
                  <select value={appForm.customer_id}
                    onChange={e => {
                      if (e.target.value === 'new') { setShowNewCustomer(true); setAppForm(p => ({ ...p, customer_id: '' })) }
                      else setAppForm(p => ({ ...p, customer_id: e.target.value }))
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required>
                    <option value="">Selecione um cliente</option>
                    <option value="new" className="text-purple-400">➕ Novo Cliente (pré-cadastro)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.phone ? `– ${c.phone}` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 text-sm font-medium">⚡ Pré-cadastro Rápido</span>
                      <button type="button" onClick={() => { setShowNewCustomer(false); setNewCustomer({ first_name:'', phone:'' }) }}
                        className="text-gray-400 hover:text-white text-sm">← Voltar</button>
                    </div>
                    <input type="text" placeholder="Nome *" value={newCustomer.first_name}
                      onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
                    <input type="tel" placeholder="Telefone *" value={newCustomer.phone}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g,'')
                        setNewCustomer(p => ({ ...p, phone: v.replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2') }))
                      }}
                      maxLength={15}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
                    <button type="button" onClick={handleCreateQuickCustomer} disabled={creatingCustomer}
                      className="w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium disabled:opacity-50">
                      {creatingCustomer ? 'Cadastrando...' : '✅ Cadastrar e Continuar'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Atendente *</label>
                <select value={appForm.barber_id}
                  onChange={e => setAppForm(p => ({ ...p, barber_id: e.target.value, service_id:'', scheduled_time:'' }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required>
                  <option value="">Selecione um atendente</option>
                  {barbers.filter(b => b.is_available).map(b => (
                    <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Serviço *{!appForm.barber_id && <span className="text-gray-500 text-sm ml-2">(selecione atendente primeiro)</span>}
                </label>
                <select value={appForm.service_id}
                  onChange={e => setAppForm(p => ({ ...p, service_id: e.target.value, scheduled_time:'' }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  required disabled={!appForm.barber_id}>
                  <option value="">{appForm.barber_id ? 'Selecione um serviço' : 'Primeiro selecione um atendente'}</option>
                  {barberServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} – {s.duration_minutes}min – R$ {s.price?.toFixed(2)}</option>
                  ))}
                </select>
                {appForm.barber_id && barberServices.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-1">⚠️ Atendente sem serviços cadastrados</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Data *</label>
                <input type="date" value={appForm.scheduled_date}
                  onChange={e => setAppForm(p => ({ ...p, scheduled_date: e.target.value, scheduled_time:'' }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Horário *</label>
                {loadingSlots ? (
                  <p className="text-gray-400 text-center py-4">Carregando horários...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="text-gray-500 text-center py-4 bg-gray-800 rounded-lg border border-gray-700">
                    {appForm.barber_id && appForm.scheduled_date && appForm.service_id
                      ? 'Nenhum horário disponível' : 'Selecione atendente, serviço e data'}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800 rounded-lg border border-gray-700">
                    {availableSlots.map(slot => (
                      <button key={slot} type="button"
                        onClick={() => setAppForm(p => ({ ...p, scheduled_time: slot }))}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          appForm.scheduled_time === slot
                            ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}>{slot}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => { setShowAppModal(false); setShowNewCustomer(false) }}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Cancelar</button>
                <button type="submit" disabled={savingApp}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium disabled:opacity-50">
                  {savingApp ? 'Salvando...' : '✅ Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Novo Cliente ─────────────────────────────────────────────── */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Novo Cliente</h2>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={clientForm.first_name}
                    onChange={e => setClientForm(p => ({ ...p, first_name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    required />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">Sobrenome</label>
                  <input type="text" value={clientForm.last_name}
                    onChange={e => setClientForm(p => ({ ...p, last_name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Telefone *</label>
                <input type="tel" value={clientForm.phone}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,'')
                    setClientForm(p => ({ ...p, phone: v.replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2') }))
                  }}
                  maxLength={15} placeholder="(00) 00000-0000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">E-mail</label>
                <input type="email" value={clientForm.email}
                  onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Data de Nascimento</label>
                <input type="date" value={clientForm.date_of_birth}
                  onChange={e => setClientForm(p => ({ ...p, date_of_birth: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Observações</label>
                <textarea value={clientForm.notes} rows={2}
                  onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setShowClientModal(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Cancelar</button>
                <button type="submit" disabled={savingClient}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium disabled:opacity-50">
                  {savingClient ? 'Salvando...' : '✅ Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Disponibilidade ──────────────────────────────────────────── */}
      {showAvailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Disponibilidade</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {barbers.filter(b => b.is_available).length} de {barbers.length} disponíveis
                </p>
              </div>
              <button onClick={() => setShowAvailModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-3">
              {barbers.length === 0 && (
                <p className="text-gray-400 text-center py-8">Nenhum atendente cadastrado</p>
              )}
              {barbers.map(b => (
                <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  b.is_available ? 'bg-green-500/10 border-green-500/40' : 'bg-gray-800/50 border-gray-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      b.is_available ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {b.first_name?.charAt(0)}{b.last_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{b.first_name} {b.last_name}</p>
                      <p className={`text-xs ${b.is_available ? 'text-green-400' : 'text-gray-500'}`}>
                        {b.is_available ? '● Disponível' : '○ Indisponível / Afastado'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleBarberAvail(b)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      b.is_available
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/40'
                    }`}>
                    {b.is_available ? 'Afastar' : 'Disponibilizar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aniversariantes ──────────────────────────────────────────── */}
      {showBdayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">🎂 Aniversariantes Hoje</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {todayDate.toLocaleDateString('pt-BR', { day:'numeric', month:'long' })}
                </p>
              </div>
              <button onClick={() => setShowBdayModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6">
              {birthdays.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-gray-400">Nenhum aniversariante hoje</p>
                  <p className="text-gray-500 text-sm mt-1">Cadastre a data de nascimento dos clientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {birthdays.map(c => {
                    const age = c.date_of_birth
                      ? new Date().getFullYear() - parseInt(c.date_of_birth.split('-')[0])
                      : null
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black">
                          {c.first_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-amber-300 text-xs">
                            {age ? `${age} anos` : ''}{c.phone ? ` · ${c.phone}` : ''}
                          </p>
                        </div>
                        <span className="text-2xl">🎂</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Dia do Calendário ────────────────────────────────────────── */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  📅 {fmtDate(`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`)}
                </h2>
                <p className="text-gray-400 text-sm mt-1">{getAptsForDay(selectedDay).length} agendamento(s)</p>
              </div>
              <button onClick={() => setShowDayModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-3">
              {getAptsForDay(selectedDay).length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum agendamento neste dia</p>
              ) : getAptsForDay(selectedDay).map(a => {
                const cfg = STATUS_LABELS[a.status] || STATUS_LABELS.pending
                return (
                  <div key={a.id} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className={`w-1.5 min-h-[40px] rounded-full flex-shrink-0 ${dotColor(a.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{a.scheduled_time?.slice(0,5)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{a.service?.name || 'Serviço'}</p>
                      <p className="text-gray-400 text-xs">
                        {a.customer ? `${a.customer.first_name} ${a.customer.last_name}` : 'Cliente'}
                        {a.barber ? ` · ${a.barber.first_name} ${a.barber.last_name}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
