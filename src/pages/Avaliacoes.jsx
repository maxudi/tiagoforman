import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STARS = [1, 2, 3, 4, 5]

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {STARS.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl transition-transform hover:scale-110 cursor-pointer ${
            s <= (hover || value) ? 'text-amber-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 'sm' }) {
  const cls = size === 'lg' ? 'text-2xl' : 'text-base'
  return (
    <div className="flex gap-0.5">
      {STARS.map(s => (
        <span key={s} className={`${cls} ${s <= value ? 'text-amber-400' : 'text-gray-700'}`}>★</span>
      ))}
    </div>
  )
}

const RATING_LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo']
const ratingLabel = (r) => RATING_LABELS[r] || ''
const ratingColor = (r) => r >= 4 ? 'text-green-400' : r === 3 ? 'text-amber-400' : 'text-red-400'
const ratingBg    = (r) => r >= 4
  ? 'border-green-500/20 bg-green-500/5'
  : r === 3
    ? 'border-amber-500/20 bg-amber-500/5'
    : 'border-red-500/20 bg-red-500/5'

export default function Avaliacoes() {
  const { userProfile } = useAuth()

  const [reviews,   setReviews]   = useState([])
  const [customers, setCustomers] = useState([])
  const [barbers,   setBarbers]   = useState([])
  const [loading,   setLoading]   = useState(true)

  // Filters
  const [search,        setSearch]        = useState('')
  const [filterRating,  setFilterRating]  = useState('all')
  const [filterBarber,  setFilterBarber]  = useState('all')
  const [filterPeriod,  setFilterPeriod]  = useState('all')
  const [filterVisible, setFilterVisible] = useState('all')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [saving,      setSaving]      = useState(false)
  const emptyForm = {
    customer_id: '',
    barber_id:   '',
    rating:      5,
    comment:     '',
    created_at:  new Date().toISOString().slice(0, 10),
    is_visible:  true,
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (userProfile?.organization_id) fetchAll()
  }, [userProfile])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [revRes, custRes, barbRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, first_name, last_name, phone')
          .eq('organization_id', userProfile.organization_id)
          .order('first_name'),
        supabase
          .from('barbers')
          .select('id, first_name, last_name')
          .eq('organization_id', userProfile.organization_id)
          .eq('is_active', true)
          .order('first_name'),
      ])
      setReviews(revRes.data || [])
      setCustomers(custRes.data || [])
      setBarbers(barbRes.data || [])
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (review = null) => {
    if (review) {
      setEditing(review)
      setForm({
        customer_id: review.customer_id || '',
        barber_id:   review.barber_id   || '',
        rating:      review.rating      || 5,
        comment:     review.comment     || '',
        created_at:  review.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        is_visible:  review.is_visible  ?? true,
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        organization_id: userProfile.organization_id,
        customer_id:     form.customer_id || null,
        barber_id:       form.barber_id   || null,
        rating:          form.rating,
        comment:         form.comment.trim() || null,
        created_at:      form.created_at,
        is_visible:      form.is_visible,
        source:          'manual',
      }

      if (editing) {
        const { error } = await supabase.from('reviews').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reviews').insert([payload])
        if (error) throw error
      }

      await fetchAll()
      closeModal()
    } catch (err) {
      alert('Erro ao salvar avaliação: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) { alert('Erro: ' + error.message); return }
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const toggleVisible = async (review) => {
    const newVal = !review.is_visible
    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: newVal })
      .eq('id', review.id)
    if (error) { alert('Erro: ' + error.message); return }
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_visible: newVal } : r))
  }

  const custName   = (id) => { const c = customers.find(x => x.id === id); return c ? `${c.first_name} ${c.last_name}`.trim() : null }
  const barberName = (id) => { const b = barbers.find(x => x.id === id);   return b ? `${b.first_name} ${b.last_name}`.trim() : null }

  const periodStart = useMemo(() => {
    if (filterPeriod === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(filterPeriod))
    return d
  }, [filterPeriod])

  const filtered = useMemo(() => reviews.filter(r => {
    if (filterRating  !== 'all' && r.rating     !== parseInt(filterRating))  return false
    if (filterBarber  !== 'all' && r.barber_id  !== filterBarber)             return false
    if (filterVisible !== 'all' && String(r.is_visible) !== filterVisible)    return false
    if (periodStart   && new Date(r.created_at) < periodStart)                return false
    if (search) {
      const s  = search.toLowerCase()
      const cn = (custName(r.customer_id)  || '').toLowerCase()
      const bn = (barberName(r.barber_id)  || '').toLowerCase()
      const cm = (r.comment || '').toLowerCase()
      if (!cn.includes(s) && !bn.includes(s) && !cm.includes(s)) return false
    }
    return true
  }), [reviews, filterRating, filterBarber, filterVisible, periodStart, search])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const stats = [
    { label: 'Total',    value: reviews.length,                                    icon: '⭐', color: 'from-amber-500 to-amber-600' },
    { label: 'Nota Média', value: avgRating ? `${avgRating} ★` : '—',              icon: '📊', color: 'from-yellow-500 to-orange-500' },
    { label: 'Positivas (4–5★)', value: reviews.filter(r => r.rating >= 4).length, icon: '👍', color: 'from-green-500 to-green-600' },
    { label: 'Negativas (1–2★)', value: reviews.filter(r => r.rating <= 2).length, icon: '👎', color: 'from-red-500 to-red-600' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-white text-xl">Carregando avaliações...</div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Avaliações</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as avaliações dos clientes</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span> Nova Avaliação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-white/70 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por cliente, atendente ou comentário..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        <select
          value={filterRating}
          onChange={e => setFilterRating(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">Todas as notas</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{r} ★ — {ratingLabel(r)}</option>
          ))}
        </select>
        <select
          value={filterBarber}
          onChange={e => setFilterBarber(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">Todos os atendentes</option>
          {barbers.map(b => (
            <option key={b.id} value={b.id}>{barberName(b.id)}</option>
          ))}
        </select>
        <select
          value={filterVisible}
          onChange={e => setFilterVisible(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">Visível e oculta</option>
          <option value="true">Somente visíveis</option>
          <option value="false">Somente ocultas</option>
        </select>
        <select
          value={filterPeriod}
          onChange={e => setFilterPeriod(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">Todo período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* Count */}
      {filtered.length !== reviews.length && (
        <p className="text-gray-500 text-sm">{filtered.length} de {reviews.length} avaliações</p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          Nenhuma avaliação encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => {
            const cn = custName(review.customer_id)
            const bn = barberName(review.barber_id)
            return (
              <div key={review.id} className={`border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between ${ratingBg(review.rating)}`}>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {/* Top row: stars + label + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarDisplay value={review.rating} />
                    <span className={`text-xs font-semibold ${ratingColor(review.rating)}`}>
                      {ratingLabel(review.rating)}
                    </span>
                    {review.source === 'bot' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">🤖 Bot</span>
                    )}
                    {review.source === 'manual' && (
                      <span className="text-xs bg-gray-600/40 text-gray-400 border border-gray-600/40 px-2 py-0.5 rounded-full">✏️ Manual</span>
                    )}
                    {!review.is_visible && (
                      <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">🚫 Oculta</span>
                    )}
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-300 text-sm italic leading-relaxed">"{review.comment}"</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {cn && <span>👤 {cn}</span>}
                    {bn && <span>💈 {bn}</span>}
                    <span>📅 {new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleVisible(review)}
                    title={review.is_visible ? 'Clique para ocultar' : 'Clique para exibir'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      review.is_visible
                        ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {review.is_visible ? '👁 Visível' : '🚫 Oculta'}
                  </button>
                  <button
                    onClick={() => openModal(review)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    🗑 Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Editar Avaliação' : 'Nova Avaliação'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Rating picker */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Nota *</label>
                <div className="flex items-center gap-4">
                  <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                  <span className={`text-sm font-semibold ${ratingColor(form.rating)}`}>
                    {form.rating} — {ratingLabel(form.rating)}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Comentário
                  <span className="text-gray-600 font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="O que o cliente disse sobre o atendimento..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Cliente
                  <span className="text-gray-600 font-normal ml-1">(opcional)</span>
                </label>
                <select
                  value={form.customer_id}
                  onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Selecionar cliente —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}{c.phone ? ` · ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barber */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Atendente
                  <span className="text-gray-600 font-normal ml-1">(opcional)</span>
                </label>
                <select
                  value={form.barber_id}
                  onChange={e => setForm(f => ({ ...f, barber_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Selecionar atendente —</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.first_name} {b.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data</label>
                  <input
                    type="date"
                    value={form.created_at}
                    onChange={e => setForm(f => ({ ...f, created_at: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Visibilidade</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      form.is_visible
                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                        : 'bg-gray-700 border-gray-600 text-gray-400'
                    }`}
                  >
                    {form.is_visible ? '👁 Visível' : '🚫 Oculta'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black py-2.5 rounded-lg font-semibold transition-colors"
                >
                  {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
