import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Horarios() {
  const { userProfile } = useAuth()
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [editingHorario, setEditingHorario] = useState(null)
  const [selectedDay, setSelectedDay] = useState('monday')
  
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    active: true
  })
  
  // Form para gerar horários automaticamente
  const [generateFormData, setGenerateFormData] = useState({
    dayOfWeek: '',
    startTime: '08:00',
    endTime: '18:00',
    slotDuration: 30 // minutos
  })

  // Mapeamento de dias EN -> PT
  const diasSemanaLabels = {
    'monday': 'Segunda-feira',
    'tuesday': 'Terça-feira',
    'wednesday': 'Quarta-feira',
    'thursday': 'Quinta-feira',
    'friday': 'Sexta-feira',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  }

  const diasSemana = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Carregar horários do banco
  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchHorarios()
    }
  }, [userProfile])

  const fetchHorarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .is('employee_id', null) // Apenas horários gerais
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      setHorarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
      alert('Erro ao carregar horários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Gerar slots automaticamente
  const generateSlots = async (e) => {
    e.preventDefault()
    
    try {
      const slots = []
      const { dayOfWeek, startTime, endTime, slotDuration } = generateFormData
      
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      
      let currentMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      
      while (currentMinutes < endMinutes) {
        const nextMinutes = currentMinutes + slotDuration
        
        const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`
        const slotEnd = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}:00`
        
        slots.push({
          organization_id: userProfile.organization_id,
          employee_id: null,
          day_of_week: dayOfWeek,
          start_time: slotStart,
          end_time: slotEnd,
          is_active: true
        })
        
        currentMinutes = nextMinutes
      }
      
      const { error } = await supabase
        .from('schedules')
        .insert(slots)
      
      if (error) throw error
      
      await fetchHorarios()
      setIsGenerateModalOpen(false)
      alert(`${slots.length} horários criados com sucesso!`)
    } catch (error) {
      console.error('Erro ao gerar horários:', error)
      alert('Erro ao gerar horários: ' + error.message)
    }
  }

  // CRUD handlers
  const handleOpenModal = (horario = null) => {
    if (horario) {
      setEditingHorario(horario)
      setFormData({
        dayOfWeek: horario.day_of_week,
        startTime: horario.start_time.substring(0, 5),
        endTime: horario.end_time.substring(0, 5),
        active: horario.is_active
      })
    } else {
      setEditingHorario(null)
      setFormData({
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHorario(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const horarioData = {
        organization_id: userProfile.organization_id,
        employee_id: null,
        day_of_week: formData.dayOfWeek,
        start_time: formData.startTime + ':00',
        end_time: formData.endTime + ':00',
        is_active: formData.active
      }

      if (editingHorario) {
        const { error } = await supabase
          .from('schedules')
          .update(horarioData)
          .eq('id', editingHorario.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([horarioData])

        if (error) throw error
      }

      await fetchHorarios()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar horário:', error)
      alert('Erro ao salvar horário: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) return

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchHorarios()
    } catch (error) {
      console.error('Erro ao excluir horário:', error)
      alert('Erro ao excluir horário: ' + error.message)
    }
  }

  const handleDeleteAllDay = async (dayOfWeek) => {
    if (!confirm(`Tem certeza que deseja excluir todos os horários de ${diasSemanaLabels[dayOfWeek]}?`)) return

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('organization_id', userProfile.organization_id)
        .eq('day_of_week', dayOfWeek)
        .is('employee_id', null)

      if (error) throw error
      await fetchHorarios()
    } catch (error) {
      console.error('Erro ao excluir horários:', error)
      alert('Erro ao excluir horários: ' + error.message)
    }
  }

  // Agrupar horários por dia da semana
  const horariosPorDia = diasSemana.reduce((acc, dia) => {
    acc[dia] = horarios.filter(h => h.day_of_week === dia)
    return acc
  }, {})

  const stats = [
    {
      label: 'Total de Slots',
      value: horarios.length,
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Slots Ativos',
      value: horarios.filter(h => h.is_active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Dias Configurados',
      value: Object.values(horariosPorDia).filter(h => h.length > 0).length,
      icon: '📆',
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Slots Inativos',
      value: horarios.filter(h => !h.is_active).length,
      icon: '⏸️',
      color: 'from-gray-500 to-gray-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando horários...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Horários de Atendimento</h1>
        <p className="text-gray-400">Cadastre os slots de horários disponíveis para agendamento</p>
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold text-white">Slots de Horários</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors"
            >
              <span className="text-xl">⚡</span>
              Gerar Horários
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
            >
              <span className="text-xl">➕</span>
              Novo Horário
            </button>
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 mb-6 overflow-x-auto">
        <div className="flex items-center p-2 gap-2">
          {diasSemana.map(dia => {
            const count = horariosPorDia[dia]?.length || 0
            return (
              <button
                key={dia}
                onClick={() => setSelectedDay(dia)}
                className={`flex-1 min-w-[120px] flex flex-col items-center gap-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedDay === dia
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-sm">{diasSemanaLabels[dia]}</span>
                <span className={`text-xs ${selectedDay === dia ? 'text-purple-100' : 'text-gray-500'}`}>
                  {count} slots
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Horarios do Dia Selecionado */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {diasSemanaLabels[selectedDay]} - {horariosPorDia[selectedDay]?.length || 0} slots
          </h3>
          {horariosPorDia[selectedDay]?.length > 0 && (
            <button
              onClick={() => handleDeleteAllDay(selectedDay)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors"
            >
              🗑️ Excluir Todos
            </button>
          )}
        </div>

        {horariosPorDia[selectedDay]?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-400 text-lg mb-4">Nenhum horário cadastrado para este dia</p>
            <button
              onClick={() => {
                setGenerateFormData({ ...generateFormData, dayOfWeek: selectedDay })
                setIsGenerateModalOpen(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
            >
              ⚡ Gerar Horários Automaticamente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {horariosPorDia[selectedDay].map(horario => (
              <div
                key={horario.id}
                className={`relative group p-4 rounded-lg border-2 transition-all ${
                  horario.is_active
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500'
                    : 'bg-gray-800/30 border-gray-700 opacity-50'
                }`}
              >
                <div className="text-center mb-3">
                  <div className="text-white font-bold text-lg">
                    {horario.start_time.substring(0, 5)}
                  </div>
                  <div className="text-gray-400 text-xs">até</div>
                  <div className="text-white font-medium text-sm">
                    {horario.end_time.substring(0, 5)}
                  </div>
                </div>

                <div className={`text-center text-xs px-2 py-1 rounded ${
                  horario.is_active 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {horario.is_active ? 'Ativo' : 'Inativo'}
                </div>

                {/* Actions - aparecem no hover */}
                <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleOpenModal(horario)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(horario.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Novo/Editar Horário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingHorario ? 'Editar Horário' : 'Novo Horário'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dia da Semana *</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>{diasSemanaLabels[dia]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Horário Início *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Horário Fim *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300 font-medium">Horário ativo</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
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
                  {editingHorario ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerar Horários Automaticamente */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">⚡ Gerar Horários</h2>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={generateSlots} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dia da Semana *</label>
                <select
                  value={generateFormData.dayOfWeek}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, dayOfWeek: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>{diasSemanaLabels[dia]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Início *</label>
                  <input
                    type="time"
                    value={generateFormData.startTime}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, startTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fim *</label>
                  <input
                    type="time"
                    value={generateFormData.endTime}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, endTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duração de Cada Slot *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 60].map(duration => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setGenerateFormData({ ...generateFormData, slotDuration: duration })}
                      className={`py-3 rounded-lg text-sm font-medium transition-all ${
                        generateFormData.slotDuration === duration
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {duration}min
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {generateFormData.dayOfWeek && generateFormData.startTime && generateFormData.endTime && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm font-medium mb-1">
                    📊 Slots que serão criados:
                  </p>
                  <p className="text-white text-2xl font-bold">
                    {Math.floor((
                      (parseInt(generateFormData.endTime.split(':')[0]) * 60 + parseInt(generateFormData.endTime.split(':')[1])) -
                      (parseInt(generateFormData.startTime.split(':')[0]) * 60 + parseInt(generateFormData.startTime.split(':')[1]))
                    ) / generateFormData.slotDuration)} horários
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all"
                >
                  ⚡ Gerar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
