import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Card Component
function SortableCard({ appointment, statusConfig, onEdit, onCancel, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: appointment.id,
    disabled: appointment.status === 'cancelled'
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = statusConfig[appointment.status]
  const isCancelled = appointment.status === 'cancelled'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isCancelled ? {} : attributes)} 
      {...(isCancelled ? {} : listeners)}
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 transition-all relative group ${!isCancelled ? 'hover:shadow-lg cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-75'}`}
    >
      {/* Action buttons - visible on hover */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!isCancelled && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(appointment) }}
              title="Editar"
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-700/80 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCancel && onCancel(appointment) }}
              title="Cancelar agendamento"
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-700/80 hover:bg-yellow-600 text-gray-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(appointment) }}
          title="Excluir"
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700/80 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="text-white font-semibold text-lg mb-1">{appointment.customer_name || 'Cliente'}</h3>
          <p className="text-gray-400 text-sm">
            {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {isCancelled && (
          <span className="text-red-400 text-xs font-bold bg-red-900 bg-opacity-50 px-2 py-1 rounded mt-6">
            🚫 Cancelado
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">🕐</span>
          <span className="text-gray-300">{appointment.scheduled_time?.slice(0, 5)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">💈</span>
          <span className="text-gray-300">{appointment.service_name || 'Serviço'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">👤</span>
          <span className="text-gray-300">{appointment.barber_name || 'Atendente'}</span>
        </div>
      </div>

      {isCancelled && appointment.cancelled_at && (
        <div className="text-xs text-red-400 mt-3 pt-3 border-t border-red-900">
          Cancelado em: {new Date(appointment.cancelled_at).toLocaleDateString('pt-BR')}
        </div>
      )}
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ id, label, icon, count, color, children, onViewAll }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-white font-bold">{label}</h3>
          <span className={`bg-${color}-500/20 text-${color}-400 text-xs font-bold px-2 py-1 rounded-full`}>
            {count}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            title="Ver todos"
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      <div className="space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

export default function Agendamentos() {
  const { userProfile } = useAuth()
  const [viewMode, setViewMode] = useState('kanban')
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [barberServices, setBarberServices] = useState([]) // Serviços do atendente selecionado
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeId, setActiveId] = useState(null)
  
  // Form states for new appointment
  const [formData, setFormData] = useState({
    customer_id: '',
    barber_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // New customer form
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    phone: ''
  })
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const [isPaused, setIsPaused] = useState(false)

  // Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [showCancelledHistory, setShowCancelledHistory] = useState(false)
  const [showAllCancelled, setShowAllCancelled] = useState(false)

  // Modal "Ver todos" genérico por status
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusModalConfig, setStatusModalConfig] = useState({ label: '', status: '' })

  const openStatusModal = (label, status) => {
    setStatusModalConfig({ label, status })
    setShowStatusModal(true)
  }

  // Edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState(null)
  const [editForm, setEditForm] = useState({ scheduled_date: '', scheduled_time: '', customer_notes: '' })

  // Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState(null)

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const statusConfig = {
    pending: {
      label: 'Aguardando',
      icon: '📅',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400'
    },
    confirmed: {
      label: 'Confirmado',
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },
    in_progress: {
      label: 'Em Atendimento',
      icon: '✂️',
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400'
    },
    completed: {
      label: 'Finalizado',
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },
    cancelled: {
      label: 'Cancelado',
      icon: '🗑️',
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400'
    }
  }

  // Fetch data on mount
  useEffect(() => {
    console.log('Setting up appointments effect, userProfile:', userProfile?.organization_id)
    if (userProfile?.organization_id) {
      fetchAppointments()
      fetchBarbers()
      fetchServices()
      fetchCustomers()
      // Fetch pause status from DB
      supabase.from('organizations').select('appointments_paused')
        .eq('id', userProfile.organization_id).single()
        .then(({ data }) => setIsPaused(data?.appointments_paused === true))
    }
  }, [userProfile?.organization_id])

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(id, first_name, last_name),
          barber:barbers(id, first_name, last_name, commission_rate),
          service:services(id, name, duration_minutes)
        `)
        .eq('organization_id', userProfile.organization_id)
        .is('deleted_at', null)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      if (error) throw error

      const formatted = data.map(apt => ({
        ...apt,
        customer_name: apt.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : '',
        barber_name: apt.barber ? `${apt.barber.first_name} ${apt.barber.last_name}` : '',
        barber_commission_rate: parseFloat(apt.barber?.commission_rate) || 0,
        service_name: apt.service?.name || '',
        service_duration: apt.service?.duration_minutes || 30
      }))

      setAppointments(formatted)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch barbers
  const fetchBarbers = async () => {
    try {
      console.log('Fetching barbers for org:', userProfile?.organization_id)
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('first_name')

      if (error) throw error
      console.log('Barbers loaded:', data)
      setBarbers(data || [])
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error)
    }
  }

  // Fetch services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('first_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  // Fetch barber services
  const fetchBarberServices = async (barberId) => {
    if (!barberId) {
      setBarberServices([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('barber_services')
        .select(`
          service_id,
          custom_price,
          custom_duration_minutes,
          service:services(
            id,
            name,
            duration_minutes,
            price
          )
        `)
        .eq('barber_id', barberId)

      if (error) throw error

      const formattedServices = data.map(bs => ({
        id: bs.service.id,
        name: bs.service.name,
        duration_minutes: bs.custom_duration_minutes || bs.service.duration_minutes,
        price: bs.custom_price || bs.service.price
      }))

      setBarberServices(formattedServices)
    } catch (error) {
      console.error('Erro ao carregar serviços do atendente:', error)
      setBarberServices([])
    }
  }

  // Create quick customer
  const handleCreateQuickCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) {
      alert('Preencha nome e telefone do cliente')
      return
    }

    try {
      setCreatingCustomer(true)
      
      // Remove formatting from phone
      const cleanPhone = newCustomer.phone.replace(/\D/g, '')
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          organization_id: userProfile.organization_id,
          first_name: newCustomer.first_name,
          last_name: '',
          phone: cleanPhone,
          email: ''
        })
        .select()
        .single()

      if (error) throw error

      // Add to customers list
      setCustomers(prev => [...prev, data])
      
      // Select this customer
      setFormData({ ...formData, customer_id: data.id })
      
      // Reset form
      setNewCustomer({ first_name: '', phone: '' })
      setShowNewCustomer(false)
      
      alert('Cliente cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      alert('Erro ao cadastrar cliente: ' + error.message)
    } finally {
      setCreatingCustomer(false)
    }
  }

  // Auto-progression: mudar status automaticamente baseado na data/hora
  const performAutoProgression = async () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    for (const apt of appointments) {
      // Ignorar cancelados e finalizados
      if (['cancelled', 'completed'].includes(apt.status)) continue

      const aptDate = apt.scheduled_date
      const aptTime = apt.scheduled_time

      // Se é hoje e está com status "pending" ou "confirmed", mover para "in_progress"
      if (aptDate === todayStr && ['pending', 'confirmed'].includes(apt.status)) {
        console.log(`⏳ Auto-progression: ${apt.customer_name} → Em Atendimento (hoje)`)
        await updateAppointmentStatus(apt.id, 'in_progress')
      }

      // Se passou a data/hora marcada, mover para "completed"
      if (aptDate < todayStr || (aptDate === todayStr && aptTime < now.toTimeString().slice(0, 5))) {
        if (apt.status !== 'completed') {
          console.log(`✅ Auto-progression: ${apt.customer_name} → Finalizado (passou horário)`)
          await updateAppointmentStatus(apt.id, 'completed')
        }
      }
    }
  }

  // Executar auto-progression apenas UMA VEZ após o carregamento inicial
  const autoProgressionRan = useRef(false)
  useEffect(() => {
    if (appointments.length > 0 && !autoProgressionRan.current) {
      autoProgressionRan.current = true
      performAutoProgression()
    }
  }, [appointments])

  // Calculate available slots based on barber, date, and service duration
  // Usa appointments.status para marcar slots como indisponíveis (não 'cancelled')
  // Quando cancelado, volta a ficar disponível automaticamente
  const calculateAvailableSlots = async (barberId, date, serviceDuration) => {
    if (!barberId || !date || !serviceDuration) {
      setAvailableSlots([])
      return
    }

    try {
      setLoadingSlots(true)
      console.log('🔍 === CALCULANDO HORÁRIOS DISPONÍVEIS ===')
      console.log(`📌 Atendente ID: ${barberId}`)
      console.log(`📅 Data: ${date}`)
      console.log(`⏱️ Duração serviço: ${serviceDuration}min`)

      // Validar organização
      if (!userProfile?.organization_id) {
        throw new Error('Organization ID não encontrado')
      }
      console.log(`🏢 Organization ID: ${userProfile.organization_id}`)

      // Obter dia da semana - CONVERTER PARA STRING (banco armazena como "monday", "tuesday", etc)
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeekNum = dateObj.getDay()
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const dayNamesDb = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayOfWeekStr = dayNamesDb[dayOfWeekNum]
      console.log(`📍 Dia da semana: ${dayNames[dayOfWeekNum]} (número: ${dayOfWeekNum}, string: "${dayOfWeekStr}")`)

      // 1. Buscar horários cadastrados para o atendente
      console.log('\n🔎 [ETAPA 1] Buscando barber_schedules...')
      const { data: barberSchedulesData, error: scheduleError } = await supabase
        .from('barber_schedules')
        .select('id, barber_id, schedule_id, schedules(id, start_time, end_time, day_of_week, is_active)')
        .eq('barber_id', barberId)

      if (scheduleError) {
        console.error('❌ Erro na query barber_schedules:', scheduleError)
        throw scheduleError
      }

      console.log(`📦 Total de barber_schedules encontrados: ${barberSchedulesData?.length || 0}`)
      
      if (barberSchedulesData && barberSchedulesData.length > 0) {
        console.log('📋 Detalhes dos primeiros 5 barber_schedules:')
        barberSchedulesData.slice(0, 5).forEach((bs, idx) => {
          const sch = bs.schedules
          console.log(`  [${idx}] day_of_week: "${sch?.day_of_week}" (tipo: ${typeof sch?.day_of_week})`)
        })
      } else {
        console.log('❌ NENHUM barber_schedule encontrado para este atendente!')
      }

      // 2. Filtrar por dia da semana e ativo
      console.log(`\n🔎 [ETAPA 2] Filtrando por day_of_week="${dayOfWeekStr}" e is_active=true...`)
      const scheduleForToday = barberSchedulesData
        ?.map(bs => bs.schedules)
        .filter(s => {
          const dayMatch = s?.day_of_week === dayOfWeekStr
          const activeMatch = s?.is_active === true
          const passes = dayMatch && activeMatch
          if (passes) {
            console.log(`  ✅ Schedule encontrado: ${s?.day_of_week} (${s?.start_time}-${s?.end_time})`)
          }
          return passes
        })

      console.log(`✅ Schedules após filtro: ${scheduleForToday?.length || 0}`)
      
      if (!scheduleForToday?.length) {
        console.log('⚠️ NENHUM SCHEDULE VÁLIDO para este dia da semana!')
        console.log(`   Procurando por: "${dayOfWeekStr}"`)
        console.log('   Dias disponíveis no banco:')
        const uniqueDays = [...new Set(barberSchedulesData?.map(bs => bs.schedules?.day_of_week))]
        console.log(`   ${uniqueDays.join(', ')}`)
        setAvailableSlots([])
        return
      }

      // 3. Gerar todos os slots possíveis (30min cada)
      console.log('\n🔎 [ETAPA 3] Gerando slots de 30 minutos...')
      const allSlots = []
      scheduleForToday.forEach((schedule, idx) => {
        console.log(`  Schedule ${idx}: ${schedule.start_time} - ${schedule.end_time}`)
        const [startH, startM] = schedule.start_time.split(':').map(Number)
        const [endH, endM] = schedule.end_time.split(':').map(Number)

        let h = startH, m = startM
        let slotsInThisSchedule = 0
        while (h < endH || (h === endH && m < endM)) {
          allSlots.push({
            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            booked: false
          })
          slotsInThisSchedule++
          m += 30
          if (m >= 60) {
            m -= 60
            h += 1
          }
        }
        console.log(`    → ${slotsInThisSchedule} slots gerados`)
      })

      console.log(`🕐 Total de slots iniciais: ${allSlots.length}`)
      console.log(`   Primeiros 5 slots: ${allSlots.slice(0, 5).map(s => s.time).join(', ')}`)

      // 4. Buscar agendamentos reservados (status !== 'cancelled')
      console.log('\n🔎 [ETAPA 4] Buscando agendamentos reservados...')
      const { data: bookedAppointments, error: aptError } = await supabase
        .from('appointments')
        .select('id, scheduled_time, scheduled_end_time, status, service:services(duration_minutes)')
        .eq('barber_id', barberId)
        .eq('scheduled_date', date)
        .neq('status', 'cancelled')

      if (aptError) {
        console.error('❌ Erro na query appointments:', aptError)
        throw aptError
      }

      console.log(`📅 Agendamentos reservados (status ≠ cancelled): ${bookedAppointments?.length || 0}`)
      if (bookedAppointments && bookedAppointments.length > 0) {
        bookedAppointments.forEach((apt, idx) => {
          console.log(`  [${idx}] ${apt.scheduled_time} - status: ${apt.status}, duração: ${apt.service?.duration_minutes}min`)
        })
      }

      // 5. Marcar slots como reservados (booked: true)
      if (bookedAppointments?.length) {
        console.log('\n🔎 [ETAPA 5] Marcando slots como bloqueados...')
        bookedAppointments.forEach(apt => {
          const aptDuration = apt.service?.duration_minutes || 30
          const slotsOccupied = Math.ceil(aptDuration / 30)
          const startTimeFormatted = apt.scheduled_time.substring(0, 5)

          const startIdx = allSlots.findIndex(s => s.time === startTimeFormatted)
          if (startIdx !== -1) {
            console.log(`  📌 Bloqueando ${startTimeFormatted} por ${slotsOccupied} slots`)
            for (let i = 0; i < slotsOccupied && startIdx + i < allSlots.length; i++) {
              allSlots[startIdx + i].booked = true
            }
          } else {
            console.log(`  ⚠️ Slot ${startTimeFormatted} não encontrado na lista!`)
          }
        })
      }

      // 6. Filtrar apenas slots disponíveis com espaço suficiente para o serviço
      console.log('\n🔎 [ETAPA 6] Filtrando slots disponíveis...')
      const slotsNeeded = Math.ceil(serviceDuration / 30)
      console.log(`  Slots necessários para serviço de ${serviceDuration}min: ${slotsNeeded}`)
      
      const availableSlots = allSlots.filter((slot, idx) => {
        let hasSpace = true
        for (let i = 0; i < slotsNeeded; i++) {
          if (!allSlots[idx + i] || allSlots[idx + i].booked) {
            hasSpace = false
            break
          }
        }
        return hasSpace
      })

      console.log(`\n✨ RESULTADO FINAL:`)
      console.log(`   Slots disponíveis: ${availableSlots.length}`)
      if (availableSlots.length > 0) {
        console.log(`   Listagem: ${availableSlots.map(s => s.time).join(', ')}`)
      } else {
        console.log(`   ⚠️ Nenhum slot disponível após todos os filtros!`)
      }
      
      setAvailableSlots(availableSlots.map(s => s.time))
    } catch (error) {
      console.error('❌ ERRO GERAL:', error.message)
      console.error('Stack:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Fetch barber services when barber is selected
  useEffect(() => {
    if (formData.barber_id) {
      fetchBarberServices(formData.barber_id)
      // Reset service selection when barber changes
      setFormData(prev => ({ ...prev, service_id: '' }))
    }
  }, [formData.barber_id])

  // Update available slots when barber, date, or service changes
  useEffect(() => {
    if (formData.barber_id && formData.scheduled_date && formData.service_id) {
      const selectedService = barberServices.find(s => s.id === formData.service_id)
      if (selectedService) {
        calculateAvailableSlots(
          formData.barber_id,
          formData.scheduled_date,
          selectedService.duration_minutes
        )
      }
    } else {
      setAvailableSlots([])
    }
  }, [formData.barber_id, formData.scheduled_date, formData.service_id, barberServices])

  // Handle drag end
  // Handle drag end - with cancellation confirmation
  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeAppointment = appointments.find(apt => apt.id === active.id)

    // over.id pode ser o ID da coluna (status) ou o UUID de um card
    // Se for um UUID de card, pegamos o status daquele card como coluna destino
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
    let newStatus = over.id
    if (!validStatuses.includes(newStatus)) {
      // over.id é um UUID de card — descobre qual coluna esse card pertence
      const overAppointment = appointments.find(apt => apt.id === over.id)
      if (!overAppointment) {
        setActiveId(null)
        return
      }
      newStatus = overAppointment.status
    }

    if (!activeAppointment || activeAppointment.status === newStatus) {
      setActiveId(null)
      return
    }

    // Se movendo para "cancelled", pedir confirmação
    if (newStatus === 'cancelled') {
      setAppointmentToCancel(activeAppointment)
      setShowCancelModal(true)
      setActiveId(null)
      return
    }

    // Perform normal status update
    await updateAppointmentStatus(activeAppointment.id, newStatus)
    setActiveId(null)
  }

  // Update appointment status in database
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      console.log(`Atualizando agendamento ${appointmentId} para status: ${newStatus}`)
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) {
        // Retry sem updated_at (coluna pode não existir no banco)
        const result = await supabase
          .from('appointments')
          .update({ status: newStatus })
          .eq('id', appointmentId)
        if (result.error) throw result.error
      }

      // Nunca sobrescrever agendamentos já cancelados (evita condição de corrida)
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId && apt.status !== 'cancelled'
            ? { ...apt, status: newStatus }
            : apt
        )
      )

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do agendamento. Tente novamente.')
    }
  }

  // Handle appointment cancellation with confirmation
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return

    try {
      const now = new Date().toISOString()

      // Tenta com cancelled_at e updated_at; se falhar (colunas ausentes), tenta só com status
      let { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('id', appointmentToCancel.id)

      if (error) {
        console.warn('Retry sem cancelled_at/updated_at:', error.message)
        const result = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointmentToCancel.id)
        error = result.error
      }

      if (error) throw error

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentToCancel.id
            ? { ...apt, status: 'cancelled', cancelled_at: now }
            : apt
        )
      )

      setShowCancelModal(false)
      setAppointmentToCancel(null)
    } catch (error) {
      console.error('❌ Erro ao cancelar:', error)
      alert('Erro ao cancelar agendamento. Tente novamente.')
    }
  }

  // Handlers para ações nos cards
  const handleCardCancel = (apt) => {
    setAppointmentToCancel(apt)
    setShowCancelModal(true)
  }

  const handleCardEdit = (apt) => {
    setAppointmentToEdit(apt)
    setEditForm({
      scheduled_date: apt.scheduled_date,
      scheduled_time: apt.scheduled_time?.slice(0, 5) || '',
      customer_notes: apt.customer_notes || ''
    })
    setShowEditModal(true)
  }

  const handleCardDelete = (apt) => {
    setAppointmentToDelete(apt)
    setShowDeleteModal(true)
  }

  // Salvar edição do agendamento
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!appointmentToEdit) return

    try {
      const [hour, min] = editForm.scheduled_time.split(':').map(Number)
      const endMinutes = hour * 60 + min + (appointmentToEdit.service_duration || 30)
      const scheduled_end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}:00`

      const updates = {
        scheduled_date: editForm.scheduled_date,
        scheduled_time: editForm.scheduled_time,
        scheduled_end_time,
        customer_notes: editForm.customer_notes
      }

      let { error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', appointmentToEdit.id)

      if (error) {
        const result = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', appointmentToEdit.id)
        error = result.error
      }

      if (error) throw error

      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentToEdit.id ? { ...apt, ...updates } : apt)
      )

      setShowEditModal(false)
      setAppointmentToEdit(null)
    } catch (error) {
      console.error('❌ Erro ao editar:', error)
      alert('Erro ao salvar edição. Tente novamente.')
    }
  }

  // Excluir agendamento (soft delete)
  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return

    try {
      let { error } = await supabase
        .from('appointments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', appointmentToDelete.id)

      if (error) {
        // Fallback: hard delete se não tiver deleted_at
        const result = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentToDelete.id)
        error = result.error
      }

      if (error) throw error

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentToDelete.id))
      setShowDeleteModal(false)
      setAppointmentToDelete(null)
    } catch (error) {
      console.error('❌ Erro ao excluir:', error)
      alert('Erro ao excluir agendamento. Tente novamente.')
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // Create new appointment
  const handleCreateAppointment = async (e) => {
    e.preventDefault()

    if (isPaused) {
      alert('⚠️ O sistema de agendamentos está pausado. Acesse o Dashboard para reativar.')
      return
    }

    if (!formData.customer_id || !formData.barber_id || !formData.service_id || !formData.scheduled_date || !formData.scheduled_time) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const selectedService = barberServices.find(s => s.id === formData.service_id)
      
      // Calculate end time based on service duration
      const [hour, min] = formData.scheduled_time.split(':').map(Number)
      const startMinutes = hour * 60 + min
      const endMinutes = startMinutes + (selectedService?.duration_minutes || 30)
      const endHour = Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      const scheduled_end_time = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          organization_id: userProfile.organization_id,
          customer_id: formData.customer_id,
          barber_id: formData.barber_id,
          service_id: formData.service_id,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time + ':00',
          scheduled_end_time,
          status: 'pending',
          service_price: selectedService?.price || 0,
          total_amount: selectedService?.price || 0
        })
        .select()

      if (error) throw error

      // Refresh appointments
      await fetchAppointments()

      // Reset form
      setFormData({
        customer_id: '',
        barber_id: '',
        service_id: '',
        scheduled_date: '',
        scheduled_time: ''
      })
      setShowNewCustomer(false)
      setNewCustomer({ first_name: '', phone: '' })
      setBarberServices([])
      setShowNewModal(false)
      alert('Agendamento criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      alert('Erro ao criar agendamento: ' + error.message)
    }
  }

  const getAppointmentsByStatus = (status) => {
    return appointments.filter(apt => apt.status === status)
  }

  // Function to get day name from date
  const getDayName = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return dayNames[date.getDay()]
  }

  // Function to format date for display
  const getFormattedDate = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year} - ${getDayName(dateString)}`
  }

  const stats = [
    {
      label: 'Aguardando',
      value: getAppointmentsByStatus('pending').length,
      subtitle: 'Aguardando confirmação',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Confirmado',
      value: getAppointmentsByStatus('confirmed').length,
      subtitle: 'Cliente confirmou',
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Em Atendimento',
      value: getAppointmentsByStatus('in_progress').length,
      subtitle: 'Em andamento',
      icon: '✂️',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      label: 'Finalizados',
      value: getAppointmentsByStatus('completed').length,
      subtitle: 'Concluídos',
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Cancelados',
      value: getAppointmentsByStatus('cancelled').length,
      subtitle: 'Cancelados',
      icon: '🗑️',
      color: 'from-red-500 to-red-600'
    }
  ]

  const activeAppointment = appointments.find(apt => apt.id === activeId)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Agendamentos</h1>
        <p className="text-gray-400">Gerencie todos os agendamentos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-white text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-gray-500 text-xs">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Agendamentos</h2>
          </div>

          <button
            onClick={() => {
              if (isPaused) {
                alert('⚠️ O sistema de agendamentos está pausado. Acesse o Dashboard para reativar.')
                return
              }
              setShowNewModal(true)
              // Reset all form states
              setFormData({
                customer_id: '',
                barber_id: '',
                service_id: '',
                scheduled_date: '',
                scheduled_time: ''
              })
              setShowNewCustomer(false)
              setNewCustomer({ first_name: '', phone: '' })
              setBarberServices([])
              setAvailableSlots([])
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white font-medium ${
              isPaused
                ? 'bg-gray-700 opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            <span className="text-xl">{isPaused ? '🚫' : '➕'}</span>
            {isPaused ? 'Agend. Pausados' : 'Novo Agendamento'}
          </button>
        </div>
      </div>

      {/* Kanban View with Drag & Drop */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Carregando agendamentos...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Pending Column */}
            <SortableContext
              id="pending"
              items={getAppointmentsByStatus('pending').map(apt => apt.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                id="pending"
                label="Aguardando"
                icon="📅"
                count={getAppointmentsByStatus('pending').length}
                color="blue"
                onViewAll={getAppointmentsByStatus('pending').length > 0 ? () => openStatusModal('Aguardando', 'pending') : null}
              >
                {getAppointmentsByStatus('pending').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig}
                    onEdit={handleCardEdit} onCancel={handleCardCancel} onDelete={handleCardDelete} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* Confirmed Column */}
            <SortableContext
              id="confirmed"
              items={getAppointmentsByStatus('confirmed').map(apt => apt.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                id="confirmed"
                label="Confirmado"
                icon="✅"
                count={getAppointmentsByStatus('confirmed').length}
                color="green"
                onViewAll={getAppointmentsByStatus('confirmed').length > 0 ? () => openStatusModal('Confirmado', 'confirmed') : null}
              >
                {getAppointmentsByStatus('confirmed').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig}
                    onEdit={handleCardEdit} onCancel={handleCardCancel} onDelete={handleCardDelete} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* In Progress Column */}
            <SortableContext
              id="in_progress"
              items={getAppointmentsByStatus('in_progress').map(apt => apt.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                id="in_progress"
                label="Em Atendimento"
                icon="✂️"
                count={getAppointmentsByStatus('in_progress').length}
                color="yellow"
                onViewAll={getAppointmentsByStatus('in_progress').length > 0 ? () => openStatusModal('Em Atendimento', 'in_progress') : null}
              >
                {getAppointmentsByStatus('in_progress').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig}
                    onEdit={handleCardEdit} onCancel={handleCardCancel} onDelete={handleCardDelete} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* Completed Column - mostra apenas 5 últimos */}
            <SortableContext
              id="completed"
              items={getAppointmentsByStatus('completed').map(apt => apt.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                id="completed"
                label="Finalizados"
                icon="✅"
                count={getAppointmentsByStatus('completed').length}
                color="green"
                onViewAll={getAppointmentsByStatus('completed').length > 0 ? () => openStatusModal('Finalizados', 'completed') : null}
              >
                {getAppointmentsByStatus('completed').slice(0, 5).map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig}
                    onEdit={handleCardEdit} onCancel={handleCardCancel} onDelete={handleCardDelete} />
                ))}
                {getAppointmentsByStatus('completed').length > 5 && (
                  <button
                    onClick={() => openStatusModal('Finalizados', 'completed')}
                    className="w-full text-xs text-gray-400 hover:text-white py-2 border border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                  >
                    + {getAppointmentsByStatus('completed').length - 5} mais...
                  </button>
                )}
              </DroppableColumn>
            </SortableContext>

            {/* Cancelled Column - mostra apenas 5 últimos */}
            <SortableContext
              id="cancelled"
              items={getAppointmentsByStatus('cancelled').map(apt => apt.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                id="cancelled"
                label="Cancelados"
                icon="🗑️"
                count={getAppointmentsByStatus('cancelled').length}
                color="red"
                onViewAll={getAppointmentsByStatus('cancelled').length > 0 ? () => openStatusModal('Cancelados', 'cancelled') : null}
              >
                {getAppointmentsByStatus('cancelled').slice(0, 5).map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig}
                    onEdit={handleCardEdit} onCancel={handleCardCancel} onDelete={handleCardDelete} />
                ))}
                {getAppointmentsByStatus('cancelled').length > 5 && (
                  <button
                    onClick={() => openStatusModal('Cancelados', 'cancelled')}
                    className="w-full text-xs text-gray-400 hover:text-white py-2 border border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                  >
                    + {getAppointmentsByStatus('cancelled').length - 5} mais...
                  </button>
                )}
              </DroppableColumn>
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId && activeAppointment && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl">
                <h3 className="text-white font-semibold">{activeAppointment.customer_name}</h3>
                <p className="text-gray-400 text-sm">{activeAppointment.service_name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Novo Agendamento</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">Cliente *</label>
                
                {!showNewCustomer ? (
                  <div className="space-y-2">
                    <select
                      value={formData.customer_id}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewCustomer(true)
                          setFormData({ ...formData, customer_id: '' })
                        } else {
                          setFormData({ ...formData, customer_id: e.target.value })
                        }
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      required={!showNewCustomer}
                    >
                      <option value="">Selecione um cliente</option>
                      <option value="new" className="text-purple-400">➕ Novo Cliente (Pré-cadastro)</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name} {customer.phone ? `- ${customer.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-400 font-medium text-sm">⚡ Pré-cadastro Rápido</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCustomer(false)
                          setNewCustomer({ first_name: '', phone: '' })
                        }}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        ← Voltar
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Nome *</label>
                      <input
                        type="text"
                        value={newCustomer.first_name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Nome do cliente"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Telefone *</label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          let formatted = value
                          if (value.length > 0) {
                            formatted = value.replace(/^(\d{2})(\d)/, '($1) $2')
                            formatted = formatted.replace(/(\d{5})(\d)/, '$1-$2')
                          }
                          setNewCustomer({ ...newCustomer, phone: formatted })
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        required
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCreateQuickCustomer}
                      disabled={creatingCustomer}
                      className="w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingCustomer ? 'Cadastrando...' : '✅ Cadastrar e Continuar'}
                    </button>
                    
                    <p className="text-gray-500 text-xs">
                      💡 Você pode completar o cadastro depois na tela de Clientes
                    </p>
                  </div>
                )}
              </div>

              {/* Barber Selection */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">Atendente *</label>
                <select
                  value={formData.barber_id}
                  onChange={(e) => setFormData({ ...formData, barber_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Selecione um atendente</option>
                  {barbers.map(barber => (
                    <option key={barber.id} value={barber.id}>
                      {barber.first_name} {barber.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Serviço *
                  {!formData.barber_id && (
                    <span className="text-gray-500 text-sm ml-2">(Selecione um atendente primeiro)</span>
                  )}
                </label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.barber_id}
                >
                  <option value="">
                    {formData.barber_id 
                      ? 'Selecione um serviço' 
                      : 'Primeiro selecione um atendente'}
                  </option>
                  {barberServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration_minutes}min - R$ {service.price?.toFixed(2)}
                    </option>
                  ))}
                </select>
                {formData.barber_id && barberServices.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    ⚠️ Este atendente não tem serviços cadastrados
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Data *
                  {formData.scheduled_date && (
                    <span className="text-purple-400 text-sm ml-2">
                      📅 {getFormattedDate(formData.scheduled_date)}
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Horário Disponível *
                  {formData.service_id && barberServices.find(s => s.id === formData.service_id) && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({barberServices.find(s => s.id === formData.service_id).duration_minutes}min - 
                      {Math.ceil(barberServices.find(s => s.id === formData.service_id).duration_minutes / 30)} slot{Math.ceil(barberServices.find(s => s.id === formData.service_id).duration_minutes / 30) > 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                
                {loadingSlots ? (
                  <div className="text-gray-400 text-center py-4">
                    Carregando horários disponíveis...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-gray-500 text-center py-4 bg-gray-800 rounded-lg border border-gray-700">
                    {formData.barber_id && formData.scheduled_date && formData.service_id
                      ? 'Nenhum horário disponível para esta data'
                      : 'Selecione atendente, serviço e data para ver horários disponíveis'}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-800 rounded-lg border border-gray-700">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, scheduled_time: slot })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.scheduled_time === slot
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
                >
                  Criar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Agendamento */}
      {showEditModal && appointmentToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white">✏️ Editar Agendamento</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 mb-5 border border-gray-600 text-sm text-gray-300">
              <p><strong>Cliente:</strong> {appointmentToEdit.customer_name}</p>
              <p className="mt-1"><strong>Serviço:</strong> {appointmentToEdit.service_name}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={editForm.scheduled_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Horário *</label>
                <input
                  type="time"
                  required
                  value={editForm.scheduled_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={editForm.customer_notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customer_notes: e.target.value }))}
                  placeholder="Observações do cliente..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-red-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">🗑️ Excluir Agendamento?</h3>
            <div className="bg-gray-800 rounded-lg p-4 mb-5 border border-gray-600 text-sm text-gray-300 space-y-1">
              <p><strong>Cliente:</strong> {appointmentToDelete.customer_name}</p>
              <p><strong>Atendente:</strong> {appointmentToDelete.barber_name}</p>
              <p><strong>Serviço:</strong> {appointmentToDelete.service_name}</p>
              <p><strong>Data/Hora:</strong> {appointmentToDelete.scheduled_date} às {appointmentToDelete.scheduled_time?.slice(0,5)}</p>
            </div>
            <p className="text-red-400 text-sm mb-5">Esta ação é permanente e não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setAppointmentToDelete(null) }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Manter
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Cancelamento */}
      {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ Cancelar Agendamento?</h3>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
              <p className="text-gray-300 mb-3">
                <strong>Cliente:</strong> {appointmentToCancel.customer_name}
              </p>
              <p className="text-gray-300 mb-3">
                <strong>Atendente:</strong> {appointmentToCancel.barber_name}
              </p>
              <p className="text-gray-300 mb-3">
                <strong>Serviço:</strong> {appointmentToCancel.service_name}
              </p>
              <p className="text-gray-300">
                <strong>Data/Hora:</strong> {appointmentToCancel.scheduled_date} às {appointmentToCancel.scheduled_time}
              </p>
            </div>

            <p className="text-gray-400 mb-6">
              O horário será liberado e disponibilizado para novos agendamentos. Esta ação pode ser consultada no histórico de cancelamentos.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setAppointmentToCancel(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
              >
                Manter
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Todos os Cancelados */}
      {showAllCancelled && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">📋 Histórico Completo de Cancelamentos</h3>
              <button
                onClick={() => setShowAllCancelled(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {appointments
                .filter(apt => apt.status === 'cancelled')
                .sort((a, b) => new Date(b.cancelled_at) - new Date(a.cancelled_at))
                .map((apt) => (
                  <div key={apt.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">{apt.customer_name}</p>
                        <p className="text-gray-400 text-sm">{apt.barber_name} • {apt.service_name}</p>
                      </div>
                      <span className="text-red-400 text-sm">
                        Cancelado em: {new Date(apt.cancelled_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      📅 {apt.scheduled_date} às {apt.scheduled_time}
                    </p>
                  </div>
                ))}
              
              {appointments.filter(apt => apt.status === 'cancelled').length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  Nenhum cancelamento registrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Todos por Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white">
                📋 {statusModalConfig.label}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({getAppointmentsByStatus(statusModalConfig.status).length} agendamentos)
                </span>
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-1">
              {getAppointmentsByStatus(statusModalConfig.status).map(apt => (
                <div key={apt.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold">{apt.customer_name}</p>
                      <p className="text-gray-400 text-sm">{apt.barber_name} • {apt.service_name}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-300">{new Date(apt.scheduled_date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-gray-400">{apt.scheduled_time?.slice(0,5)}</p>
                    </div>
                  </div>
                  {apt.cancelled_at && (
                    <p className="text-red-400 text-xs mt-2">Cancelado em: {new Date(apt.cancelled_at).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              ))}
              {getAppointmentsByStatus(statusModalConfig.status).length === 0 && (
                <p className="text-gray-400 text-center py-8">Nenhum agendamento neste status</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
