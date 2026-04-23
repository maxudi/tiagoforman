import { useState, useEffect } from 'react'
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
function SortableCard({ appointment, statusConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = statusConfig[appointment.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{appointment.customer_name || 'Cliente'}</h3>
          <p className="text-gray-400 text-sm">
            {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}
          </p>
        </div>
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
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ id, label, icon, count, color, children }) {
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
          barber:barbers(id, first_name, last_name),
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
        .eq('active', true)
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

  // Calculate available slots based on barber, date, and service duration
  const calculateAvailableSlots = async (barberId, date, serviceDuration) => {
    if (!barberId || !date) {
      setAvailableSlots([])
      return
    }

    try {
      setLoadingSlots(true)
      console.log('🔍 === Iniciando cálculo de slots ===')
      console.log('Barber ID:', barberId)
      console.log('Data:', date)
      console.log('Duração do serviço:', serviceDuration, 'minutos')

      // Get day of week (0 = Sunday, 1 = Monday, etc)
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeek = dateObj.getDay()
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      console.log('Dia da semana:', dayOfWeek, `(${dayNames[dayOfWeek]})`)

      // Get barber's schedules for this day of week
      const { data: barberSchedulesData, error: barberSchedulesError } = await supabase
        .from('barber_schedules')
        .select(`
          id,
          schedule_id,
          schedules(
            id,
            start_time,
            end_time,
            day_of_week,
            is_active
          )
        `)
        .eq('barber_id', barberId)

      if (barberSchedulesError) {
        console.error('❌ Erro ao buscar barber_schedules:', barberSchedulesError)
        throw barberSchedulesError
      }
      
      console.log('📦 Barber schedules encontrados:', barberSchedulesData?.length || 0)
      console.log('Dados completos:', JSON.stringify(barberSchedulesData, null, 2))

      // Filter for this day of week
      const todaySchedules = barberSchedulesData
        ?.map(bs => bs.schedules)
        .filter(s => {
          console.log('Verificando schedule:', s)
          return s && s.day_of_week === dayOfWeek && s.is_active
        })

      console.log('✅ Schedules para hoje:', todaySchedules?.length || 0)
      console.log('Detalhes dos schedules:', JSON.stringify(todaySchedules, null, 2))

      // Get all existing appointments for this barber on this date
      const { data: existingAppointments, error: aptError } = await supabase
        .from('appointments')
        .select('scheduled_time, scheduled_end_time, service:services(duration_minutes)')
        .eq('barber_id', barberId)
        .eq('scheduled_date', date)
        .neq('status', 'cancelled')

      if (aptError) throw aptError
      console.log('📅 Agendamentos existentes:', existingAppointments?.length || 0)

      // Generate all possible slots from barber's schedule
      const allSlots = []
      if (todaySchedules && todaySchedules.length > 0) {
        todaySchedules.forEach((schedule, idx) => {
          if (!schedule || !schedule.start_time || !schedule.end_time) {
            console.log(`⚠️ Schedule ${idx} inválido:`, schedule)
            return
          }

          console.log(`Processing schedule ${idx}: ${schedule.start_time} - ${schedule.end_time}`)

          const [startHour, startMin] = schedule.start_time.split(':').map(Number)
          const [endHour, endMin] = schedule.end_time.split(':').map(Number)

          let currentHour = startHour
          let currentMin = startMin

          while (
            currentHour < endHour ||
            (currentHour === endHour && currentMin < endMin)
          ) {
            allSlots.push({
              time: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
              available: true
            })

            // Increment by 30 minutes
            currentMin += 30
            if (currentMin >= 60) {
              currentMin -= 60
              currentHour += 1
            }
          }
        })
      }

      console.log('🕐 Total de slots gerados:', allSlots.length)
      if (allSlots.length > 0) {
        console.log('Primeiros 5 slots:', allSlots.slice(0, 5))
      }

      // Mark slots as unavailable based on existing appointments
      const slotsNeeded = Math.ceil(serviceDuration / 30)
      
      existingAppointments.forEach(apt => {
        const aptDuration = apt.service?.duration_minutes || 30
        const aptSlotsNeeded = Math.ceil(aptDuration / 30)
        const aptStartTime = apt.scheduled_time.slice(0, 5)
        
        const startIdx = allSlots.findIndex(s => s.time === aptStartTime)
        if (startIdx !== -1) {
          // Mark this slot and the next (aptSlotsNeeded - 1) slots as unavailable
          for (let i = 0; i < aptSlotsNeeded && startIdx + i < allSlots.length; i++) {
            allSlots[startIdx + i].available = false
          }
        }
      })

      // Filter to only show slots where there's enough consecutive availability
      const availableSlotsList = allSlots.filter((slot, idx) => {
        // Check if this slot and the next (slotsNeeded - 1) slots are available
        for (let i = 0; i < slotsNeeded; i++) {
          if (!allSlots[idx + i] || !allSlots[idx + i].available) {
            return false
          }
        }
        return true
      })

      console.log('✨ Slots disponíveis finais:', availableSlotsList.length)
      if (availableSlotsList.length > 0) {
        console.log('Primeiros 5 disponíveis:', availableSlotsList.slice(0, 5))
      } else {
        console.log('⚠️ NENHUM SLOT DISPONÍVEL!')
      }
      
      setAvailableSlots(availableSlotsList)
    } catch (error) {
      console.error('❌ Erro ao calcular slots disponíveis:', error)
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
  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeAppointment = appointments.find(apt => apt.id === active.id)
    const newStatus = over.id

    if (activeAppointment && activeAppointment.status !== newStatus) {
      try {
        // Update in database
        const { error } = await supabase
          .from('appointments')
          .update({ status: newStatus })
          .eq('id', activeAppointment.id)

        if (error) throw error

        // Update local state
        setAppointments(prev =>
          prev.map(apt =>
            apt.id === activeAppointment.id ? { ...apt, status: newStatus } : apt
          )
        )
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
        alert('Erro ao atualizar status do agendamento')
      }
    }

    setActiveId(null)
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // Create new appointment
  const handleCreateAppointment = async (e) => {
    e.preventDefault()

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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Agendamento
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
              >
                {getAppointmentsByStatus('pending').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig} />
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
              >
                {getAppointmentsByStatus('confirmed').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig} />
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
              >
                {getAppointmentsByStatus('in_progress').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* Completed Column */}
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
              >
                {getAppointmentsByStatus('completed').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* Cancelled Column */}
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
              >
                {getAppointmentsByStatus('cancelled').map(apt => (
                  <SortableCard key={apt.id} appointment={apt} statusConfig={statusConfig} />
                ))}
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
                <label className="block text-gray-300 font-medium mb-2">Data *</label>
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
                        key={slot.time}
                        type="button"
                        onClick={() => setFormData({ ...formData, scheduled_time: slot.time })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.scheduled_time === slot.time
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {slot.time}
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
    </div>
  )
}
