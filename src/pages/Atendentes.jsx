import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ImageUpload from '../components/ImageUpload'

export default function Atendentes() {
  const { userProfile } = useAuth()
  const [atendentes, setAtendentes] = useState([])
  const [servicos, setServicos] = useState([])
  const [todosHorarios, setTodosHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')
  const [editingAtendente, setEditingAtendente] = useState(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commissionRate: 0,
    active: true,
    available: true,
    avatarUrl: ''
  })
  
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedSchedules, setSelectedSchedules] = useState([]) // IDs dos schedules
  const [exceptions, setExceptions] = useState([])
  const [newException, setNewException] = useState({ date: '', reason: '' })
  const [expandedDays, setExpandedDays] = useState([]) // Dias expandidos no accordion

  const diasSemanaLabels = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  useEffect(() => {
    if (userProfile?.organization_id) {
      Promise.all([
        fetchAtendentes(),
        fetchServicos(),
        fetchHorarios()
      ])
    }
  }, [userProfile])

  const fetchAtendentes = async () => {
    try {
      setLoading(true)
      
      // Buscar atendentes
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('first_name')

      if (barbersError) throw barbersError
      
      // Para cada atendente, buscar seus serviços
      const atendentesComServicos = await Promise.all(
        (barbersData || []).map(async (barber) => {
          const { data: servicesData } = await supabase
            .from('barber_services')
            .select('service_id')
            .eq('barber_id', barber.id)
          
          return {
            ...barber,
            service_ids: servicesData?.map(s => s.service_id) || []
          }
        })
      )
      
      setAtendentes(atendentesComServicos)
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('organization_id', userProfile.organization_id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServicos(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const fetchHorarios = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .is('employee_id', null)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      setTodosHorarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    }
  }

  const fetchAtendentesSchedules = async (atendenteId) => {
    try {
      const { data, error } = await supabase
        .from('barber_schedules')
        .select('schedule_id')
        .eq('barber_id', atendenteId)

      if (error) throw error
      return data.map(bs => bs.schedule_id)
    } catch (error) {
      console.error('Erro ao carregar horários do atendente:', error)
      return []
    }
  }

  const fetchExceptions = async (atendenteId) => {
    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('barber_id', atendenteId)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao carregar exceções:', error)
      return []
    }
  }

  const fetchBarberServices = async (barberId) => {
    try {
      console.log('🔍 Carregando serviços do barber_id:', barberId)
      
      const { data, error } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId)

      if (error) {
        console.error('❌ Erro ao carregar serviços do barbeiro:', error)
        throw error
      }
      
      const serviceIds = data.map(bs => bs.service_id)
      console.log('✅ Serviços carregados:', serviceIds)
      
      return serviceIds
    } catch (error) {
      console.error('❌ Erro ao carregar serviços do barbeiro:', error)
      return []
    }
  }

  const handleOpenModal = async (atendente = null) => {
    setActiveTab('dados')
    
    if (atendente) {
      console.log('✏️ Editando atendente:', atendente)
      setEditingAtendente(atendente)
      setFormData({
        firstName: atendente.first_name,
        lastName: atendente.last_name,
        email: atendente.email || '',
        phone: atendente.phone || '',
        commissionRate: atendente.commission_rate || 0,
        active: atendente.is_active,
        available: atendente.is_available,
        avatarUrl: atendente.avatar_url || ''
      })
      
      // Carregar serviços, horários e exceções do atendente
      const services = await fetchBarberServices(atendente.id)
      console.log('📋 Setando selectedServices:', services)
      setSelectedServices(services)
      
      const schedules = await fetchAtendentesSchedules(atendente.id)
      setSelectedSchedules(schedules)
      
      const excs = await fetchExceptions(atendente.id)
      setExceptions(excs)
    } else {
      console.log('➕ Criando novo atendente')
      setEditingAtendente(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        commissionRate: 0,
        active: true,
        available: true,
        avatarUrl: ''
      })
      setSelectedServices([])
      setSelectedSchedules([])
      setExceptions([])
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAtendente(null)
    setNewException({ date: '', reason: '' })
    setExpandedDays([]) // Resetar dias expandidos
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const atendenteData = {
        organization_id: userProfile.organization_id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone,
        commission_rate: formData.commissionRate,
        is_active: formData.active,
        is_available: formData.available,
        avatar_url: formData.avatarUrl || null
      }

      let atendenteId

      if (editingAtendente) {
        // Atualizar
        const { error } = await supabase
          .from('barbers')
          .update(atendenteData)
          .eq('id', editingAtendente.id)

        if (error) throw error
        atendenteId = editingAtendente.id
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('barbers')
          .insert([atendenteData])
          .select()
          .single()

        if (error) throw error
        atendenteId = data.id
      }

      // Salvar serviços (barber_services)
      await saveServices(atendenteId)

      // Salvar horários (barber_schedules)
      await saveSchedules(atendenteId)

      await fetchAtendentes()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar atendente:', error)
      alert('Erro ao salvar atendente: ' + error.message)
    }
  }

  const saveServices = async (atendenteId) => {
    try {
      console.log('🔧 Salvando serviços para barber_id:', atendenteId)
      console.log('📋 Serviços selecionados:', selectedServices)
      
      // Deletar serviços antigos
      const { error: deleteError } = await supabase
        .from('barber_services')
        .delete()
        .eq('barber_id', atendenteId)

      if (deleteError) {
        console.error('❌ Erro ao deletar serviços antigos:', deleteError)
        throw deleteError
      }

      // Inserir novos serviços
      if (selectedServices.length > 0) {
        const inserts = selectedServices.map(serviceId => ({
          barber_id: atendenteId,
          service_id: serviceId
        }))

        console.log('📥 Inserindo serviços:', inserts)

        const { data, error } = await supabase
          .from('barber_services')
          .insert(inserts)
          .select()

        if (error) {
          console.error('❌ Erro ao inserir serviços:', error)
          throw error
        }

        console.log('✅ Serviços salvos com sucesso:', data)
      } else {
        console.log('⚠️ Nenhum serviço selecionado para salvar')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar serviços:', error)
      throw error
    }
  }

  const saveSchedules = async (atendenteId) => {
    try {
      // Deletar horários antigos
      await supabase
        .from('barber_schedules')
        .delete()
        .eq('barber_id', atendenteId)

      // Inserir novos horários
      if (selectedSchedules.length > 0) {
        const inserts = selectedSchedules.map(scheduleId => ({
          barber_id: atendenteId,
          schedule_id: scheduleId
        }))

        const { error } = await supabase
          .from('barber_schedules')
          .insert(inserts)

        if (error) throw error
      }
    } catch (error) {
      console.error('Erro ao salvar horários:', error)
      throw error
    }
  }

  const handleAddException = async () => {
    if (!newException.date || !newException.reason) {
      alert('Preencha data e motivo')
      return
    }

    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .insert([{
          organization_id: userProfile.organization_id,
          barber_id: editingAtendente.id,
          date: newException.date,
          reason: newException.reason,
          is_available: false
        }])
        .select()
        .single()

      if (error) throw error

      setExceptions([data, ...exceptions])
      setNewException({ date: '', reason: '' })
    } catch (error) {
      console.error('Erro ao adicionar exceção:', error)
      alert('Erro ao adicionar exceção: ' + error.message)
    }
  }

  const handleDeleteException = async (id) => {
    try {
      const { error } = await supabase
        .from('schedule_exceptions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExceptions(exceptions.filter(e => e.id !== id))
    } catch (error) {
      console.error('Erro ao excluir exceção:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este atendente?')) return

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAtendentes()
    } catch (error) {
      console.error('Erro ao excluir atendente:', error)
      alert('Erro ao excluir atendente: ' + error.message)
    }
  }

  const toggleSchedule = (scheduleId) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    )
  }

  const toggleAllDay = (dayOfWeek, checked) => {
    const daySchedules = todosHorarios
      .filter(h => h.day_of_week === dayOfWeek)
      .map(h => h.id)

    if (checked) {
      setSelectedSchedules(prev => [...new Set([...prev, ...daySchedules])])
    } else {
      setSelectedSchedules(prev => prev.filter(id => !daySchedules.includes(id)))
    }
  }

  const toggleDayExpanded = (dayOfWeek) => {
    setExpandedDays(prev => 
      prev.includes(dayOfWeek)
        ? [] // Se já estava aberto, fecha
        : [dayOfWeek] // Se estava fechado, abre e fecha os outros
    )
  }

  const horariosPorDia = todosHorarios.reduce((acc, h) => {
    if (!acc[h.day_of_week]) acc[h.day_of_week] = []
    acc[h.day_of_week].push(h)
    return acc
  }, {})

  const stats = [
    {
      label: 'Total de Atendentes',
      value: atendentes.length,
      icon: '👥',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Atendentes Ativos',
      value: atendentes.filter(a => a.is_active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Disponíveis Agora',
      value: atendentes.filter(a => a.is_available && a.is_active).length,
      icon: '🟢',
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Comissão Média',
      value: atendentes.length > 0 
        ? `${(atendentes.reduce((sum, a) => sum + (a.commission_rate || 0), 0) / atendentes.length).toFixed(1)}%`
        : '0%',
      icon: '💰',
      color: 'from-amber-500 to-amber-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando atendentes...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Atendentes</h1>
        <p className="text-gray-400">Gerencie os profissionais que realizam os atendimentos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <p className="text-white text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Lista de Atendentes</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Atendente
          </button>
        </div>
      </div>

      {/* Atendentes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atendentes.map(atendente => (
          <div
            key={atendente.id}
            className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border transition-all ${
              atendente.is_active
                ? 'border-gray-800 hover:border-purple-500/50'
                : 'border-gray-800/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {atendente.avatar_url ? (
                  <img
                    src={atendente.avatar_url}
                    alt={`${atendente.first_name} ${atendente.last_name}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    {atendente.first_name[0]}{atendente.last_name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {atendente.first_name} {atendente.last_name}
                  </h3>
                  <p className="text-gray-400 text-sm">{atendente.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${
                  atendente.is_available ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Serviços</p>
                <div className="flex flex-wrap gap-1">
                  {atendente.service_ids && atendente.service_ids.length > 0 ? (
                    atendente.service_ids.map((serviceId, idx) => {
                      const service = servicos.find(s => s.id === serviceId)
                      return service ? (
                        <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          {service.name}
                        </span>
                      ) : null
                    })
                  ) : (
                    <span className="text-gray-500 text-xs">Nenhum serviço</span>
                  )}
                </div>
              </div>

              {atendente.commission_rate > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Comissão</p>
                  <p className="text-white font-medium">{atendente.commission_rate}%</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenModal(atendente)}
                className="flex-1 py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(atendente.id)}
                className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingAtendente ? `Editar Atendente: ${editingAtendente.first_name}` : 'Novo Atendente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800 px-6">
              <div className="flex gap-2">
                {[
                  { id: 'dados', label: 'Dados Básicos', icon: '📝' },
                  { id: 'servicos', label: 'Serviços', icon: '✂️' },
                  { id: 'horarios', label: 'Horários', icon: '⏰' },
                  ...(editingAtendente ? [{ id: 'excecoes', label: 'Exceções', icon: '📅' }] : [])
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-medium transition-all border-b-2 ${
                      activeTab === tab.id
                        ? 'text-white border-purple-500'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tab: Dados Básicos */}
              {activeTab === 'dados' && (
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <ImageUpload
                    currentImageUrl={formData.avatarUrl}
                    onImageUploaded={(url) => setFormData({ ...formData, avatarUrl: url })}
                    bucket="images"
                    folder="avatars"
                    label="Foto do Atendente"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sobrenome *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Comissão (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300 font-medium">Atendente ativo</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-gray-300 font-medium">Disponível para agendamentos</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab: Serviços */}
              {activeTab === 'servicos' && (
                <div className="p-6">
                  <p className="text-gray-400 mb-4">Selecione os serviços que este atendente pode realizar:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {servicos.map(servico => (
                      <label
                        key={servico.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedServices.includes(servico.id)
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(servico.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices([...selectedServices, servico.id])
                            } else {
                              setSelectedServices(selectedServices.filter(id => id !== servico.id))
                            }
                          }}
                          className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500"
                        />
                        <span className="text-white font-medium">{servico.name}</span>
                      </label>
                    ))}
                  </div>
                  {servicos.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nenhum serviço cadastrado ainda</p>
                  )}
                </div>
              )}

              {/* Tab: Horários */}
              {activeTab === 'horarios' && (
                <div className="p-6 space-y-3">
                  <p className="text-gray-400 mb-4">Selecione os horários em que este atendente estará disponível:</p>
                  
                  {Object.entries(horariosPorDia).map(([day, horarios]) => {
                    const selectedCount = horarios.filter(h => selectedSchedules.includes(h.id)).length
                    const allSelected = selectedCount === horarios.length
                    const isExpanded = expandedDays.includes(day)

                    return (
                      <div key={day} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                        {/* Header - Sempre visível */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/70 transition-colors"
                          onClick={() => toggleDayExpanded(day)}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`text-2xl transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                            <span className="text-white font-bold text-lg">{diasSemanaLabels[day]}</span>
                            <label 
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => toggleAllDay(day, e.target.checked)}
                                className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500"
                              />
                              <span className="text-gray-300 text-sm">Selecionar todos</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            {selectedCount > 0 && (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                                {selectedCount} de {horarios.length}
                              </span>
                            )}
                            {!isExpanded && selectedCount === 0 && (
                              <span className="text-gray-500 text-sm">Nenhum horário selecionado</span>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo - Expansível */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-gray-700">
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-4">
                              {horarios.map(horario => (
                                <label
                                  key={horario.id}
                                  className={`flex flex-col items-center p-2 rounded cursor-pointer transition-all text-xs ${
                                    selectedSchedules.includes(horario.id)
                                      ? 'bg-purple-500/30 border-2 border-purple-500 text-white'
                                      : 'bg-gray-700/50 border-2 border-transparent text-gray-400 hover:border-gray-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSchedules.includes(horario.id)}
                                    onChange={() => toggleSchedule(horario.id)}
                                    className="hidden"
                                  />
                                  <span className="font-bold">{horario.start_time.substring(0, 5)}</span>
                                  <span className="text-xs opacity-75">{horario.end_time.substring(0, 5)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {Object.keys(horariosPorDia).length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Nenhum horário cadastrado. Cadastre horários na página de Horários primeiro.
                    </p>
                  )}
                </div>
              )}

              {/* Tab: Exceções */}
              {activeTab === 'excecoes' && editingAtendente && (
                <div className="p-6 space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <p className="text-blue-300 text-sm">
                      📅 Cadastre datas específicas em que o atendente não estará disponível (férias, folgas, etc)
                    </p>
                  </div>

                  {/* Nova Exceção */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-4">Adicionar Nova Indisponibilidade</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                        <input
                          type="date"
                          value={newException.date}
                          onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Motivo</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newException.reason}
                            onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                            placeholder="Ex: Férias, Viagem, Folga..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddException}
                            className="px-4 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors"
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Exceções */}
                  <div>
                    <h3 className="text-white font-bold mb-3">Indisponibilidades Cadastradas</h3>
                    {exceptions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhuma exceção cadastrada</p>
                    ) : (
                      <div className="space-y-2">
                        {exceptions.map(exc => (
                          <div
                            key={exc.id}
                            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                          >
                            <div>
                              <p className="text-white font-medium">
                                {new Date(exc.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-gray-400 text-sm">{exc.reason}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteException(exc.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="border-t border-gray-800 p-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
                >
                  {editingAtendente ? 'Salvar Alterações' : 'Criar Atendente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
