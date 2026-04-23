import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TABS = [
  { id: 'overview',     label: 'Visão Geral',   icon: '📊' },
  { id: 'financeiro',   label: 'Financeiro',    icon: '💰' },
  { id: 'agendamentos', label: 'Agendamentos',  icon: '📅' },
  { id: 'atendentes',   label: 'Atendentes',    icon: '💈' },
  { id: 'clientes',     label: 'Clientes',      icon: '👥' },
  { id: 'avaliacoes',   label: 'Avaliações',    icon: '⭐' },
]

const PERIODS = [
  { value: '7',   label: 'Últimos 7 dias' },
  { value: '30',  label: 'Últimos 30 dias' },
  { value: '90',  label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
]

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function Bar({ label, value, max, color = 'bg-purple-500', formatVal }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-gray-300 text-sm w-28 truncate flex-shrink-0 group-hover:text-white transition-colors" title={label}>{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-7 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${pct}%` }}>
          {pct > 12 && <span className="text-white text-xs font-semibold whitespace-nowrap">{formatVal ? formatVal(value) : value}</span>}
        </div>
      </div>
      {pct <= 12 && <span className="text-gray-400 text-xs whitespace-nowrap">{formatVal ? formatVal(value) : value}</span>}
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, color = 'from-purple-500 to-pink-500' }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-3`}>{icon}</div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-5">{title}</h3>
      {children}
    </div>
  )
}

export default function Relatorios() {
  const { userProfile } = useAuth()
  const [period, setPeriod] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Raw data
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([]) // all-time for top clients
  const [allCustomers, setAllCustomers] = useState([])       // all-time for name mapping
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])
  const [newCustomers, setNewCustomers] = useState([])

  const fetchAll = useCallback(async () => {
    if (!userProfile?.organization_id) return
    const orgId = userProfile.organization_id
    const since = new Date()
    since.setDate(since.getDate() - parseInt(period))
    const sinceStr = since.toISOString().split('T')[0]

    setLoading(true)
    const [aptsRes, allAptsRes, barbersRes, svcsRes, reviewsRes, custRes, allCustRes] = await Promise.all([
      // Period appointments — sem filtro deleted_at para incluir cancelados/deletados no relatório
      supabase.from('appointments')
        .select('id, scheduled_date, scheduled_time, status, total_amount, service_price, barber_id, service_id, customer_id, created_at')
        .eq('organization_id', orgId)
        .gte('scheduled_date', sinceStr)
        .order('scheduled_date', { ascending: true }),

      // All-time appointments (for top clients)
      supabase.from('appointments')
        .select('customer_id, status')
        .eq('organization_id', orgId),

      supabase.from('barbers')
        .select('id, first_name, last_name, commission_rate')
        .eq('organization_id', orgId).eq('is_active', true),

      supabase.from('services')
        .select('id, name, price, duration_minutes')
        .eq('organization_id', orgId).eq('is_active', true),

      // Reviews — sem filtro de data para garantir todos
      supabase.from('reviews')
        .select('id, rating, created_at, appointment_id')
        .eq('organization_id', orgId)
        .gte('created_at', sinceStr + 'T00:00:00'),

      // New customers in period
      supabase.from('customers')
        .select('id, first_name, last_name, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', sinceStr + 'T00:00:00')
        .order('created_at', { ascending: false }),

      // All customers for name mapping
      supabase.from('customers')
        .select('id, first_name, last_name')
        .eq('organization_id', orgId),
    ])

    setAppointments(aptsRes.data || [])
    setAllAppointments(allAptsRes.data || [])
    setBarbers(barbersRes.data || [])
    setServices(svcsRes.data || [])
    setReviews(reviewsRes.data || [])
    setNewCustomers(custRes.data || [])
    setAllCustomers(allCustRes.data || [])
    setLoading(false)
  }, [userProfile, period])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Computed ─────────────────────────────────────────────────────────────────
  const computed = useMemo(() => {
    const completed  = appointments.filter(a => a.status === 'completed')
    const cancelled  = appointments.filter(a => a.status === 'cancelled')
    const pending    = appointments.filter(a => a.status === 'pending')
    const confirmed  = appointments.filter(a => a.status === 'confirmed')

    // Helper: amount com fallback para service_price
    const getAmount = (a) => parseFloat(a.total_amount) || parseFloat(a.service_price) || 0

    const totalRevenue   = completed.reduce((s, a) => s + getAmount(a), 0)
    const totalCommission = completed.reduce((acc, apt) => {
      const b = barbers.find(b => b.id === apt.barber_id)
      return acc + getAmount(apt) * ((b?.commission_rate || 0) / 100)
    }, 0)
    const avgTicket      = completed.length > 0 ? totalRevenue / completed.length : 0
    const cancellationRate = appointments.length > 0 ? (cancelled.length / appointments.length * 100) : 0
    const completionRate   = appointments.length > 0 ? (completed.length / appointments.length * 100) : 0
    const avgRating        = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

    // Revenue by barber
    const revenueByBarber = barbers.map(b => {
      const bApts = completed.filter(a => a.barber_id === b.id)
      const revenue = bApts.reduce((s, a) => s + getAmount(a), 0)
      const commission = revenue * ((b.commission_rate || 0) / 100)
      const allPeriod = appointments.filter(a => a.barber_id === b.id).length
      return {
        id: b.id,
        name: `${b.first_name} ${b.last_name}`,
        appointments: bApts.length,
        allAppointments: allPeriod,
        revenue, commission,
        net: revenue - commission,
        commissionRate: b.commission_rate || 0,
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Revenue by service
    const revenueByService = services.map(s => {
      const sApts = completed.filter(a => a.service_id === s.id)
      const revenue = sApts.reduce((sum, a) => sum + (a.total_amount || 0), 0)
      return { name: s.name, appointments: sApts.length, revenue }
    }).filter(s => s.appointments > 0).sort((a, b) => b.appointments - a.appointments)

    // Most requested services (all statuses)
    const allByService = services.map(s => {
      const sApts = appointments.filter(a => a.service_id === s.id)
      return { name: s.name, count: sApts.length }
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

    // By day of week
    const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    const byDow = DOW.map((label, i) => ({
      label,
      count: appointments.filter(a => new Date(a.scheduled_date + 'T00:00:00').getDay() === i).length,
    }))

    // By hour
    const byHour = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2,'0')}h`,
      count: appointments.filter(a => a.scheduled_time && parseInt(a.scheduled_time) === h).length,
    })).filter(h => h.count > 0)

    // Revenue trend by date
    const revByDate = {}
    completed.forEach(a => {
      revByDate[a.scheduled_date] = (revByDate[a.scheduled_date] || 0) + (a.total_amount || 0)
    })
    const revenueTrend = Object.entries(revByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ label: fmtDate(date), value }))

    // Appointments trend by date
    const aptByDate = {}
    appointments.forEach(a => {
      aptByDate[a.scheduled_date] = (aptByDate[a.scheduled_date] || 0) + 1
    })
    const appointmentsTrend = Object.entries(aptByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ label: fmtDate(date), value }))

    // Top clients (all-time completed) com nomes
    const clientCount = {}
    allAppointments.filter(a => a.status === 'completed').forEach(a => {
      if (a.customer_id) clientCount[a.customer_id] = (clientCount[a.customer_id] || 0) + 1
    })
    const topClients = Object.entries(clientCount)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => {
        const cust = allCustomers.find(c => c.id === id)
        return {
          id,
          name: cust ? `${cust.first_name} ${cust.last_name}`.trim() : 'Cliente',
          count,
        }
      })

    // Rating distribution
    const ratingDist = [5,4,3,2,1].map(r => ({
      label: '★'.repeat(r),
      count: reviews.filter(rv => rv.rating === r).length,
    }))

    // Status breakdown
    const statusBreakdown = [
      { label: 'Concluídos',   count: completed.length,  color: 'bg-green-500', pct: completionRate },
      { label: 'Cancelados',   count: cancelled.length,  color: 'bg-red-500',   pct: cancellationRate },
      { label: 'Confirmados',  count: confirmed.length,  color: 'bg-blue-500',  pct: appointments.length > 0 ? confirmed.length / appointments.length * 100 : 0 },
      { label: 'Pendentes',    count: pending.length,    color: 'bg-yellow-500',pct: appointments.length > 0 ? pending.length / appointments.length * 100 : 0 },
    ]

    return {
      completed, cancelled, pending, confirmed,
      totalRevenue, totalCommission, avgTicket,
      cancellationRate, completionRate, avgRating,
      revenueByBarber, revenueByService, allByService,
      byDow, byHour, revenueTrend, appointmentsTrend,
      clientCount, topClients, ratingDist, statusBreakdown,
      netRevenue: totalRevenue - totalCommission,
    }
  }, [appointments, allAppointments, allCustomers, barbers, services, reviews])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Carregando relatórios...</p>
      </div>
    </div>
  )

  const c = computed

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Relatórios</h1>
          <p className="text-gray-400">Análise completa do negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => { setPeriod(e.target.value) }}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500">
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={fetchAll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium">
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-900/50 border border-gray-800 rounded-xl p-1 mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: VISÃO GERAL
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon="📅" label="Total Agendamentos" value={appointments.length} color="from-blue-500 to-blue-600" />
            <KPI icon="✅" label="Concluídos"
              value={c.completed.length}
              sub={`${c.completionRate.toFixed(1)}% do total`}
              color="from-green-500 to-green-600" />
            <KPI icon="💰" label="Receita Total"
              value={fmt(c.totalRevenue)}
              sub={`Ticket médio ${fmt(c.avgTicket)}`}
              color="from-amber-500 to-yellow-500" />
            <KPI icon="⭐" label="Avaliação Média"
              value={c.avgRating ? `${c.avgRating} / 5.0` : '—'}
              sub={`${reviews.length} avaliações`}
              color="from-purple-500 to-pink-500" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon="❌" label="Cancelamentos"
              value={c.cancelled.length}
              sub={`${c.cancellationRate.toFixed(1)}% do total`}
              color="from-red-500 to-red-600" />
            <KPI icon="💸" label="Comissões Pagas"
              value={fmt(c.totalCommission)}
              sub="Soma das comissões"
              color="from-orange-500 to-orange-600" />
            <KPI icon="🏦" label="Receita Líquida"
              value={fmt(c.netRevenue)}
              sub="Após comissões"
              color="from-teal-500 to-teal-600" />
            <KPI icon="👤" label="Novos Clientes"
              value={newCustomers.length}
              sub="Cadastros no período"
              color="from-indigo-500 to-indigo-600" />
          </div>

          {/* Status + Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Distribuição por Status">
              <div className="space-y-3">
                {c.statusBreakdown.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{s.label}</span>
                      <span className="text-white font-medium">{s.count} ({s.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className={`${s.color} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Serviços Mais Solicitados">
              {c.allByService.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : c.allByService.slice(0, 6).map((s, i) => (
                  <Bar key={i} label={s.name} value={s.count}
                    max={c.allByService[0]?.count || 1} color="from-purple-500 to-pink-500" />
                ))
              }
            </Section>
          </div>

          {/* Trend receita */}
          {c.revenueTrend.length > 0 && (
            <Section title="Tendência de Receita (dias com vendas)">
              <div className="space-y-1.5">
                {c.revenueTrend.map((d, i) => (
                  <Bar key={i} label={d.label} value={d.value}
                    max={Math.max(...c.revenueTrend.map(x => x.value))}
                    color="bg-amber-500" formatVal={fmt} />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: FINANCEIRO
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon="💰" label="Receita Bruta"        value={fmt(c.totalRevenue)}     color="from-green-500 to-green-600" />
            <KPI icon="💸" label="Total Comissões"      value={fmt(c.totalCommission)}  color="from-orange-500 to-orange-600" />
            <KPI icon="🏦" label="Receita Líquida"      value={fmt(c.netRevenue)}       color="from-teal-500 to-teal-600" />
            <KPI icon="🎯" label="Ticket Médio"         value={fmt(c.avgTicket)}        sub={`${c.completed.length} serviços`} color="from-purple-500 to-pink-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Receita por Atendente">
              {c.revenueByBarber.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : c.revenueByBarber.map((b, i) => (
                  <Bar key={i} label={b.name} value={b.revenue}
                    max={c.revenueByBarber[0]?.revenue || 1}
                    color="bg-green-500" formatVal={fmt} />
                ))
              }
            </Section>

            <Section title="Receita por Serviço">
              {c.revenueByService.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : c.revenueByService.map((s, i) => (
                  <Bar key={i} label={s.name} value={s.revenue}
                    max={c.revenueByService[0]?.revenue || 1}
                    color="bg-amber-500" formatVal={fmt} />
                ))
              }
            </Section>
          </div>

          {/* Receita diária */}
          {c.revenueTrend.length > 0 && (
            <Section title="Receita por Dia">
              <div className="space-y-1.5">
                {c.revenueTrend.map((d, i) => (
                  <Bar key={i} label={d.label} value={d.value}
                    max={Math.max(...c.revenueTrend.map(x => x.value))}
                    color="bg-amber-500" formatVal={fmt} />
                ))}
              </div>
            </Section>
          )}

          {/* Tabela detalhada por atendente */}
          <Section title="Resumo Financeiro por Atendente">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Atendente','Serviços','Receita Bruta','Comissão (%)','Valor Comissão','Receita Líquida'].map(h => (
                      <th key={h} className="text-gray-400 font-medium text-left pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.revenueByBarber.map((b, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="text-white py-3 pr-4 font-medium">{b.name}</td>
                      <td className="text-gray-300 py-3 pr-4">{b.appointments}</td>
                      <td className="text-green-400 py-3 pr-4">{fmt(b.revenue)}</td>
                      <td className="text-orange-400 py-3 pr-4">{b.commissionRate}%</td>
                      <td className="text-orange-400 py-3 pr-4">{fmt(b.commission)}</td>
                      <td className="text-teal-400 py-3 pr-4 font-semibold">{fmt(b.net)}</td>
                    </tr>
                  ))}
                  {c.revenueByBarber.length > 0 && (
                    <tr className="border-t-2 border-gray-700 bg-gray-800/20">
                      <td className="text-white py-3 pr-4 font-bold">TOTAL</td>
                      <td className="text-gray-300 py-3 pr-4 font-bold">{c.completed.length}</td>
                      <td className="text-green-400 py-3 pr-4 font-bold">{fmt(c.totalRevenue)}</td>
                      <td className="text-gray-400 py-3 pr-4">—</td>
                      <td className="text-orange-400 py-3 pr-4 font-bold">{fmt(c.totalCommission)}</td>
                      <td className="text-teal-400 py-3 pr-4 font-bold">{fmt(c.netRevenue)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {c.revenueByBarber.length === 0 && (
                <p className="text-gray-500 text-center py-8">Sem dados financeiros no período</p>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AGENDAMENTOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'agendamentos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon="📅" label="Total"       value={appointments.length}              color="from-blue-500 to-blue-600" />
            <KPI icon="✅" label="Concluídos"  value={c.completed.length}   sub={`${c.completionRate.toFixed(1)}%`}  color="from-green-500 to-green-600" />
            <KPI icon="❌" label="Cancelados"  value={c.cancelled.length}   sub={`${c.cancellationRate.toFixed(1)}%`} color="from-red-500 to-red-600" />
            <KPI icon="⏳" label="Pendentes"   value={c.pending.length}                 color="from-yellow-500 to-yellow-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Agendamentos por Dia da Semana">
              <div className="space-y-2">
                {c.byDow.map((d, i) => (
                  <Bar key={i} label={d.label} value={d.count}
                    max={Math.max(...c.byDow.map(x => x.count), 1)}
                    color="bg-blue-500" />
                ))}
              </div>
            </Section>

            <Section title="Agendamentos por Horário">
              {c.byHour.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : (
                  <div className="space-y-1.5">
                    {c.byHour.map((h, i) => (
                      <Bar key={i} label={h.label} value={h.count}
                        max={Math.max(...c.byHour.map(x => x.count), 1)}
                        color="bg-indigo-500" />
                    ))}
                  </div>
                )
              }
            </Section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Serviços Mais Solicitados">
              {c.allByService.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : c.allByService.map((s, i) => (
                  <Bar key={i} label={s.name} value={s.count}
                    max={c.allByService[0]?.count || 1}
                    color="bg-purple-500" />
                ))
              }
            </Section>

            <Section title="Status Detalhado">
              <div className="space-y-4">
                {c.statusBreakdown.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-300 font-medium">{s.label}</span>
                      <span className="text-white font-bold">{s.count} <span className="text-gray-400 font-normal">({s.pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div className={`${s.color} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Tendência de agendamentos */}
          {c.appointmentsTrend.length > 0 && (
            <Section title="Volume de Agendamentos por Dia">
              <div className="space-y-1.5">
                {c.appointmentsTrend.map((d, i) => (
                  <Bar key={i} label={d.label} value={d.value}
                    max={Math.max(...c.appointmentsTrend.map(x => x.value), 1)}
                    color="bg-blue-500" />
                ))}
              </div>
            </Section>
          )}

          {/* Tabela por atendente */}
          <Section title="Agendamentos por Atendente">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Atendente','Total','Concluídos','Cancelados','Pendentes','Taxa Conclusão'].map(h => (
                      <th key={h} className="text-gray-400 font-medium text-left pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.revenueByBarber.map((b, i) => {
                    const barberApts = appointments.filter(a => a.barber_id === b.id)
                    const bCompleted  = barberApts.filter(a => a.status === 'completed').length
                    const bCancelled  = barberApts.filter(a => a.status === 'cancelled').length
                    const bPending    = barberApts.filter(a => a.status === 'pending').length
                    const bRate       = barberApts.length > 0 ? (bCompleted / barberApts.length * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                        <td className="text-white py-3 pr-4 font-medium">{b.name}</td>
                        <td className="text-gray-300 py-3 pr-4">{b.allAppointments}</td>
                        <td className="text-green-400 py-3 pr-4">{b.appointments}</td>
                        <td className="text-red-400 py-3 pr-4">{bCancelled}</td>
                        <td className="text-yellow-400 py-3 pr-4">{bPending}</td>
                        <td className="py-3 pr-4">
                          <span className={`font-semibold ${parseFloat(bRate) >= 70 ? 'text-green-400' : parseFloat(bRate) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {bRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {barbers.length === 0 && <p className="text-gray-500 text-center py-8">Sem atendentes cadastrados</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ATENDENTES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'atendentes' && (
        <div className="space-y-6">
          {c.revenueByBarber.length === 0
            ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">💈</p>
                <p>Sem dados de atendentes no período</p>
              </div>
            )
            : c.revenueByBarber.map((b, i) => {
              const total = b.allAppointments
              const concRate = total > 0 ? (b.appointments / total * 100) : 0
              return (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{b.name}</h3>
                      <p className="text-gray-400 text-sm">Comissão: {b.commissionRate}%</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold text-green-400">{fmt(b.revenue)}</p>
                      <p className="text-gray-400 text-sm">Receita bruta</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-400">{total}</p>
                      <p className="text-gray-400 text-xs mt-1">Total Agend.</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{b.appointments}</p>
                      <p className="text-gray-400 text-xs mt-1">Concluídos</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-orange-400">{fmt(b.commission)}</p>
                      <p className="text-gray-400 text-xs mt-1">Comissão</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-teal-400">{fmt(b.net)}</p>
                      <p className="text-gray-400 text-xs mt-1">Líquido</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">Taxa de conclusão</span>
                      <span className={`font-semibold ${concRate >= 70 ? 'text-green-400' : concRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {concRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${concRate >= 70 ? 'bg-green-500' : concRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${concRate}%`, transition: 'width 0.7s' }} />
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CLIENTES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPI icon="👤" label="Novos Clientes"     value={newCustomers.length}  sub="Cadastrados no período" color="from-indigo-500 to-indigo-600" />
            <KPI icon="🔄" label="Clientes Ativos"    value={Object.keys(c.clientCount).length} sub="Com agend. (all-time)" color="from-purple-500 to-purple-600" />
            <KPI icon="📋" label="Agendamentos/Cliente"
              value={Object.keys(c.clientCount).length > 0
                ? (allAppointments.filter(a => a.status === 'completed').length / Object.keys(c.clientCount).length).toFixed(1)
                : '0.0'}
              sub="Média de visitas" color="from-teal-500 to-teal-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top clientes */}
            <Section title="Top Clientes (all-time, por visitas concluídas)">
              {c.topClients.length === 0
                ? <p className="text-gray-500 text-center py-6">Sem dados</p>
                : (() => {
                  const maxCount = c.topClients[0]?.count || 1
                  return (
                    <div className="space-y-2">
                      {c.topClients.map((client, i) => (
                        <div key={client.id} className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                            {i + 1}
                          </span>
                          <Bar label={client.name} value={client.count}
                            max={maxCount} color="bg-indigo-500" />
                        </div>
                      ))}
                    </div>
                  )
                })()
              }
            </Section>

            {/* Novos clientes no período */}
            <Section title={`Novos Clientes no Período (${newCustomers.length})`}>
              {newCustomers.length === 0
                ? <p className="text-gray-500 text-center py-6">Nenhum cliente novo no período</p>
                : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {newCustomers.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {c.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(c.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </Section>
          </div>

          {/* Retenção */}
            <Section title="Fidelidade dos Clientes (all-time)">
              {(() => {
                const dist = [
                  { label: '1 visita (novos)',      count: Object.values(c.clientCount).filter(v => v === 1).length,  color: 'bg-blue-500' },
                  { label: '2–3 visitas',           count: Object.values(c.clientCount).filter(v => v >= 2 && v <= 3).length, color: 'bg-indigo-500' },
                  { label: '4–6 visitas',           count: Object.values(c.clientCount).filter(v => v >= 4 && v <= 6).length, color: 'bg-purple-500' },
                  { label: '7+ visitas (fiéis)',    count: Object.values(c.clientCount).filter(v => v >= 7).length,   color: 'bg-pink-500' },
                ]
              const maxD = Math.max(...dist.map(d => d.count), 1)
              return (
                <div className="space-y-3">
                  {dist.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{d.label}</span>
                        <span className="text-white font-medium">{d.count} clientes</span>
                      </div>
                      <div className="bg-gray-800 rounded-full h-5 overflow-hidden">
                        <div className={`${d.color} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${Math.max((d.count / maxD) * 100, d.count > 0 ? 3 : 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AVALIAÇÕES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPI icon="⭐" label="Nota Média"
              value={c.avgRating ? `${c.avgRating} / 5.0` : '—'}
              sub={`${reviews.length} avaliações no período`}
              color="from-amber-500 to-yellow-500" />
            <KPI icon="😄" label="Avaliações 4-5 ★"
              value={reviews.filter(r => r.rating >= 4).length}
              sub={reviews.length > 0 ? `${(reviews.filter(r => r.rating >= 4).length / reviews.length * 100).toFixed(1)}% do total` : ''}
              color="from-green-500 to-green-600" />
            <KPI icon="😞" label="Avaliações 1-2 ★"
              value={reviews.filter(r => r.rating <= 2).length}
              sub={reviews.length > 0 ? `${(reviews.filter(r => r.rating <= 2).length / reviews.length * 100).toFixed(1)}% do total` : ''}
              color="from-red-500 to-red-600" />
          </div>

          {reviews.length === 0
            ? (
              <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-xl">
                <p className="text-5xl mb-4">⭐</p>
                <p className="text-white text-xl font-semibold mb-2">Nenhuma avaliação no período</p>
                <p className="text-gray-500">As avaliações dos clientes aparecerão aqui</p>
              </div>
            )
            : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Distribuição de Notas">
                  <div className="space-y-4">
                    {c.ratingDist.map((r, i) => {
                      const pct = reviews.length > 0 ? (r.count / reviews.length * 100) : 0
                      const colors = ['bg-green-500','bg-lime-500','bg-yellow-500','bg-orange-500','bg-red-500']
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-amber-400 font-medium text-sm">{'★'.repeat(5 - i)}{'☆'.repeat(i)}</span>
                            <span className="text-white text-sm font-semibold">{r.count} <span className="text-gray-400 font-normal">({pct.toFixed(1)}%)</span></span>
                          </div>
                          <div className="bg-gray-800 rounded-full h-5 overflow-hidden">
                            <div className={`${colors[i]} h-full rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Visual gauge */}
                  {c.avgRating && (
                    <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                      <p className="text-gray-400 text-sm mb-2">Nota média geral</p>
                      <p className="text-5xl font-black text-amber-400 mb-1">{c.avgRating}</p>
                      <div className="flex justify-center gap-1 text-2xl">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={parseFloat(c.avgRating) >= s ? 'text-amber-400' : parseFloat(c.avgRating) >= s - 0.5 ? 'text-amber-400/50' : 'text-gray-700'}>★</span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>

                <Section title="Últimas Avaliações">
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {[...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                        <div>
                          <div className="flex gap-0.5 mb-1">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={s <= r.rating ? 'text-amber-400' : 'text-gray-700'}>★</span>
                            ))}
                          </div>
                          <p className="text-gray-500 text-xs">
                            {new Date(r.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                        <span className={`text-lg font-bold ${r.rating >= 4 ? 'text-green-400' : r.rating >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {r.rating}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
