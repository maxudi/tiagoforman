import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { userProfile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(null)
  const [appointmentsPaused, setAppointmentsPaused] = useState(false) // Pausar todos os agendamentos

  const stats = [
    { label: 'Agendamentos Hoje', value: '12', icon: '📅', color: 'from-blue-500 to-blue-600' },
    { label: 'Agendamentos Mês', value: '87', icon: '📊', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Receita do Mês', value: 'R$ 8.450', icon: '💰', color: 'from-amber-500 to-yellow-500' },
    { label: 'Avaliação Média', value: '4.8', icon: '⭐', color: 'from-purple-500 to-purple-600' },
  ]

  // Dados mockados para o calendário - agendamentos detalhados
  const appointmentsByDate = {
    '2026-04-23': [
      { id: 1, time: '09:00', service: 'Corte + Barba', color: 'bg-green-500' },
      { id: 2, time: '14:00', service: 'Corte', color: 'bg-blue-500' },
    ],
    '2026-04-24': [
      { id: 3, time: '10:00', service: 'Barba', color: 'bg-purple-500' },
      { id: 4, time: '11:00', service: 'Corte', color: 'bg-blue-500' },
      { id: 5, time: '15:00', service: 'Corte + Barba', color: 'bg-green-500' },
    ],
    '2026-04-25': [
      { id: 6, time: '16:00', service: 'Corte', color: 'bg-blue-500' },
    ],
    '2026-04-28': [
      { id: 7, time: '09:00', service: 'Corte + Barba', color: 'bg-green-500' },
      { id: 8, time: '13:00', service: 'Barba', color: 'bg-purple-500' },
    ],
    '2026-04-30': [
      { id: 9, time: '11:00', service: 'Corte', color: 'bg-red-500' },
      { id: 10, time: '14:00', service: 'Corte', color: 'bg-amber-500' },
    ],
  }

  // Aniversariantes de hoje (mock)
  const birthdaysToday = [
    { name: 'João Silva', phone: '+5534999999999' },
    { name: 'Maria Santos', phone: '+5534988888888' },
  ]
  // Lista de atendentes (mock)
  const employees = [
    { id: 1, name: 'Tiago Forman', isAvailable: true },
    { id: 2, name: 'Carlos Silva', isAvailable: true },
    { id: 3, name: 'João Santos', isAvailable: false },
  ]
  // Gerar dias do mês atual
  const generateCalendar = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return { days, month, year }
  }

  const { days, month, year } = generateCalendar()
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const handleDayClick = (day) => {
    if (!day) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    // Aqui você pode abrir um modal ou navegar para página de detalhes
    const appointments = appointmentsByDate[dateStr] || []
    console.log('Agendamentos do dia:', dateStr, appointments)
  }

  const getAppointmentsForDay = (day) => {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointmentsByDate[dateStr] || []
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {userProfile?.first_name}!
        </h1>
        <p className="text-gray-400">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <p className="text-white text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left">
            <span className="text-2xl">➕</span>
            <div>
              <p className="text-white font-medium">Novo Agendamento</p>
              <p className="text-gray-400 text-sm">Criar agendamento</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-white font-medium">Novo Cliente</p>
              <p className="text-gray-400 text-sm">Cadastrar cliente</p>
            </div>
          </button>
          <button 
            onClick={() => setAppointmentsPaused(!appointmentsPaused)}
            className={`flex items-center gap-3 p-4 rounded-lg transition-all text-left relative ${
              appointmentsPaused 
                ? 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50' 
                : 'bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50'
            }`}
          >
            <span className="text-2xl">{appointmentsPaused ? '⏸️' : '▶️'}</span>
            <div>
              <p className="text-white font-medium">
                {appointmentsPaused ? 'Agendamentos Pausados' : 'Pausar Agendamentos'}
              </p>
              <p className={`text-sm ${appointmentsPaused ? 'text-red-300' : 'text-green-300'}`}>
                {appointmentsPaused ? 'Sistema pausado' : 'Sistema ativo'}
              </p>
            </div>
            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${
              appointmentsPaused ? 'bg-red-500' : 'bg-green-500'
            } animate-pulse`}></div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-white font-medium">Disponibilidade</p>
              <p className="text-gray-400 text-sm">Gerenciar atendentes</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left relative">
            <span className="text-2xl">🎂</span>
            <div>
              <p className="text-white font-medium">Aniversariantes Hoje</p>
              <p className="text-gray-400 text-sm">{birthdaysToday.length} aniversariante{birthdaysToday.length !== 1 ? 's' : ''}</p>
            </div>
            {birthdaysToday.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {birthdaysToday.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Disponibilidade dos Atendentes */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Disponibilidade dos Atendentes</h2>
          <span className="text-sm text-gray-400">
            {employees.filter(e => e.isAvailable).length} de {employees.length} disponíveis
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => (
            <div
              key={employee.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                employee.isAvailable
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    employee.isAvailable
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{employee.name}</p>
                    <p className={`text-sm ${employee.isAvailable ? 'text-green-400' : 'text-gray-500'}`}>
                      {employee.isAvailable ? 'Disponível' : 'Indisponível'}
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  employee.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
                }`}></div>
              </div>
              <button
                onClick={() => {
                  // Aqui você vai implementar a lógica para alternar disponibilidade
                  console.log(`Toggle availability for ${employee.name}`)
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  employee.isAvailable
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
                }`}
              >
                {employee.isAvailable ? 'Marcar Indisponível' : 'Marcar Disponível'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {monthNames[month]} de {year}
          </h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
              ← Anterior
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Próximo →
            </button>
          </div>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-400 py-3 bg-gray-800/30 rounded-t-lg">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const appointments = getAppointmentsForDay(day)
            const today = isToday(day)
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[120px] rounded-lg p-2 transition-all cursor-pointer
                  ${!day ? 'invisible' : ''}
                  ${today ? 'bg-amber-500/10 border-2 border-amber-500' : 'bg-gray-800/30 border border-gray-700'}
                  ${day && !today ? 'hover:bg-gray-800/50 hover:border-gray-600' : ''}
                `}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    {/* Day number */}
                    <div className={`text-sm font-semibold mb-2 ${today ? 'text-amber-400' : 'text-gray-300'}`}>
                      {day}
                    </div>
                    
                    {/* Appointments */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {appointments.slice(0, 3).map((apt, idx) => (
                        <div
                          key={apt.id}
                          className={`${apt.color} text-white text-xs px-2 py-1 rounded truncate`}
                          title={`${apt.time} - ${apt.service}`}
                        >
                          {apt.service}
                          <div className="text-[10px] opacity-80">{apt.time}</div>
                        </div>
                      ))}
                      {appointments.length > 3 && (
                        <div className="text-[10px] text-gray-400 text-center mt-1">
                          +{appointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedDate && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-white font-semibold mb-3">
              📅 Agendamentos de {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </h3>
            <div className="space-y-2">
              {(appointmentsByDate[selectedDate] || []).map(apt => (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${apt.color}`}></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{apt.service}</p>
                    <p className="text-gray-400 text-sm">{apt.time}</p>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    Ver →
                  </button>
                </div>
              ))}
              {(!appointmentsByDate[selectedDate] || appointmentsByDate[selectedDate].length === 0) && (
                <p className="text-gray-400 text-center py-4">Nenhum agendamento neste dia</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                C
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Cliente agendou Corte + Barba</p>
                <p className="text-gray-400 text-sm">Há 15 minutos</p>
              </div>
              <span className="text-green-400 text-sm">Confirmado</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
