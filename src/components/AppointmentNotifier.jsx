import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 20_000 // 20 segundos

// Toca um som de notificação via Web Audio API (sem arquivo externo)
function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const notes = [
      { freq: 523.25, start: 0.00 },   // C5
      { freq: 659.25, start: 0.18 },   // E5
      { freq: 783.99, start: 0.36 },   // G5
    ]

    notes.forEach(({ freq, start }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.45)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.5)
    })
  } catch (_) {
    // Navegador bloqueou AudioContext antes de interação do usuário — silent fail
  }
}

function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Entrada com pequeno delay para trigger da transição
    const t1 = setTimeout(() => setVisible(true), 20)
    // Auto-dismiss
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 350)
    }, 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onClose])

  const dismiss = () => {
    setVisible(false)
    setTimeout(onClose, 350)
  }

  const fmtDate = (d) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }
  const fmtTime = (t) => t?.slice(0, 5) || ''

  return (
    <div
      className={`
        w-80 bg-gray-900 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">📅</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">
                Novo Agendamento
              </p>
              <p className="text-white font-medium text-sm leading-tight truncate">
                {toast.customerName}
              </p>
              {toast.serviceName && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">
                  ✂️ {toast.serviceName}
                </p>
              )}
              {toast.barberName && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">
                  💈 {toast.barberName}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                🗓 {fmtDate(toast.scheduled_date)}
                {toast.scheduled_time && ` às ${fmtTime(toast.scheduled_time)}`}
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800">
        <div className="h-full bg-amber-500/50 animate-[shrink_7s_linear_forwards]" />
      </div>
    </div>
  )
}

export default function AppointmentNotifier() {
  const { userProfile } = useAuth()
  const [toasts, setToasts] = useState([])
  const channelRef = useRef(null)

  const addToast = useCallback((data) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, ...data }])
    playSound()
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    if (!userProfile?.organization_id) return

    const orgId = userProfile.organization_id

    // Guarda o ID do agendamento mais recente já visto para comparar no próximo poll
    let lastSeenId = null
    let lastSeenAt = new Date().toISOString()

    const enrich = async (apt) => {
      const [custRes, svcRes, barbRes] = await Promise.all([
        apt.customer_id
          ? supabase.from('customers').select('first_name, last_name').eq('id', apt.customer_id).single()
          : Promise.resolve({ data: null }),
        apt.service_id
          ? supabase.from('services').select('name').eq('id', apt.service_id).single()
          : Promise.resolve({ data: null }),
        apt.barber_id
          ? supabase.from('barbers').select('first_name, last_name').eq('id', apt.barber_id).single()
          : Promise.resolve({ data: null }),
      ])
      return {
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        customerName: custRes.data
          ? `${custRes.data.first_name} ${custRes.data.last_name}`.trim()
          : 'Cliente',
        serviceName: svcRes.data?.name || null,
        barberName: barbRes.data
          ? `${barbRes.data.first_name} ${barbRes.data.last_name}`.trim()
          : null,
      }
    }

    // Inicializa: busca o ID mais recente para não disparar toast nos já existentes
    const init = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data?.[0]) {
        lastSeenId = data[0].id
        lastSeenAt = data[0].created_at
      }
    }

    const poll = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', orgId)
        .gt('created_at', lastSeenAt)
        .order('created_at', { ascending: true })

      if (error || !data?.length) return

      // Atualiza o marcador para o mais recente desta rodada
      lastSeenAt = data[data.length - 1].created_at
      lastSeenId = data[data.length - 1].id

      // Dispara uma notificação por agendamento novo
      for (const apt of data) {
        const enriched = await enrich(apt)
        addToast(enriched)
      }
    }

    let cancelled = false

    init().then(() => {
      if (cancelled) return
      channelRef.current = setInterval(poll, POLL_INTERVAL)
    })

    return () => {
      cancelled = true
      if (channelRef.current) {
        clearInterval(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userProfile?.organization_id, addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}
