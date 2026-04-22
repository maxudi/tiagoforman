import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Agendamentos() {
  const { userProfile } = useAuth()
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'lista'
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock data - substituir por dados do Supabase
  const appointments = [
    {
      id: 1,
      customer: 'Ricardo',
      service: 'Combo (Corte & Barba)',
      employee: 'João',
      date: '31-03-2025',
      time: '17:00',
      status: 'aguardando',
      daysUntil: 3
    },
    {
      id: 2,
      customer: 'Felipe',
      service: 'Combo (Corte & Barba)',
      employee: 'João',
      date: '01-04-2025',
      time: '17:00',
      status: 'aguardando',
      daysUntil: 4
    },
    {
      id: 3,
      customer: 'Vitor',
      service: 'Corte',
      employee: 'Lucas',
      date: '29-03-2025',
      time: '08:00',
      status: 'confirmado',
      daysUntil: 1
    },
    {
      id: 4,
      customer: 'Carlos',
      service: 'Barba',
      employee: 'Tiago',
      date: '29-03-2025',
      time: '09:30',
      status: 'em_atendimento',
      daysUntil: 0
    },
    {
      id: 5,
      customer: 'Fernando',
      service: 'Combo (Corte & Barba)',
      employee: 'João',
      date: '26-03-2025',
      time: '10:00',
      status: 'finalizado',
      daysUntil: -2
    },
    {
      id: 6,
      customer: 'Joaquim',
      service: 'Combo (Corte & Barba)',
      employee: 'João',
      date: '02-04-2025',
      time: '11:00',
      status: 'finalizado',
      daysUntil: -5
    },
    {
      id: 7,
      customer: 'Marcos',
      service: 'Corte',
      employee: 'Lucas',
      date: '28-03-2025',
      time: '11:00',
      status: 'cancelado',
      daysUntil: null
    },
    {
      id: 8,
      customer: 'Mauricio',
      service: 'Combo (Corte & Barba)',
      employee: 'Lucas',
      date: '04-04-2025',
      time: '11:00',
      status: 'cancelado',
      daysUntil: null
    }
  ]

  const statusConfig = {
    aguardando: {
      label: 'Aguardando',
      icon: '📅',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400'
    },
    confirmado: {
      label: 'Confirmado',
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },
    em_atendimento: {
      label: 'Em Atendimento',
      icon: '✂️',
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400'
    },
    finalizado: {
      label: 'Finalizado',
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },
    cancelado: {
      label: 'Cancelado',
      icon: '🗑️',
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400'
    }
  }

  const getAppointmentsByStatus = (status) => {
    return appointments.filter(apt => apt.status === status)
  }

  const stats = [
    {
      label: 'Aguardando',
      value: getAppointmentsByStatus('aguardando').length,
      subtitle: 'Aguardando atendimento',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Confirmado',
      value: getAppointmentsByStatus('confirmado').length,
      subtitle: 'Cliente confirmou',
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Em Atendimento',
      value: getAppointmentsByStatus('em_atendimento').length,
      subtitle: 'Atendimentos em andamento',
      icon: '✂️',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      label: 'Finalizados',
      value: getAppointmentsByStatus('finalizado').length,
      subtitle: 'Atendimentos concluídos',
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Cancelados',
      value: getAppointmentsByStatus('cancelado').length,
      subtitle: 'Agendamentos cancelados',
      icon: '🗑️',
      color: 'from-red-500 to-red-600'
    }
  ]

  const AppointmentCard = ({ appointment }) => {
    const config = statusConfig[appointment.status]
    
    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">{appointment.customer}</h3>
            {appointment.daysUntil !== null && (
              <p className="text-gray-400 text-sm">
                {appointment.daysUntil === 0 ? 'Hoje' : appointment.daysUntil > 0 ? `em ${appointment.daysUntil} dia${appointment.daysUntil > 1 ? 's' : ''}` : `há ${Math.abs(appointment.daysUntil)} dia${Math.abs(appointment.daysUntil) > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white">
            ⋮
          </button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📅</span>
            <span className="text-gray-300">{appointment.date} - {appointment.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">💈</span>
            <span className="text-gray-300">{appointment.service}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">👤</span>
            <span className="text-gray-300">{appointment.employee}</span>
          </div>
        </div>

        {appointment.status === 'aguardando' && (
          <button className="w-full py-2 px-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium transition-colors">
            Confirmar Agendamento
          </button>
        )}
        
        {appointment.status === 'confirmado' && (
          <button className="w-full py-2 px-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm font-medium transition-colors">
            Iniciar Atendimento
          </button>
        )}

        {appointment.status === 'em_atendimento' && (
          <button className="w-full py-2 px-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium transition-colors">
            Finalizar Atendimento
          </button>
        )}
      </div>
    )
  }

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
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'lista'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium">
            <span className="text-xl">➕</span>
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Aguardando Column */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-white font-bold">Aguardando</h3>
                <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
                  {getAppointmentsByStatus('aguardando').length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {getAppointmentsByStatus('aguardando').map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>

          {/* Confirmado Column */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-white font-bold">Confirmado</h3>
                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                  {getAppointmentsByStatus('confirmado').length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {getAppointmentsByStatus('confirmado').map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>

          {/* Em Atendimento Column */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✂️</span>
                <h3 className="text-white font-bold">Em Atendimento</h3>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
                  {getAppointmentsByStatus('em_atendimento').length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {getAppointmentsByStatus('em_atendimento').map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>

          {/* Finalizados Column */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-white font-bold">Finalizados</h3>
                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                  {getAppointmentsByStatus('finalizado').length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {getAppointmentsByStatus('finalizado').map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>

          {/* Cancelados Column */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗑️</span>
                <h3 className="text-white font-bold">Cancelados</h3>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                  {getAppointmentsByStatus('cancelado').length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {getAppointmentsByStatus('cancelado').map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista View */}
      {viewMode === 'lista' && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
                <th className="text-left p-4 text-gray-400 font-medium">Data/Hora</th>
                <th className="text-left p-4 text-gray-400 font-medium">Serviço</th>
                <th className="text-left p-4 text-gray-400 font-medium">Atendente</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Prazo</th>
                <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {appointments.map(apt => {
                const config = statusConfig[apt.status]
                return (
                  <tr key={apt.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <span className="text-white font-medium">{apt.customer}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm">
                        <div>{apt.date}</div>
                        <div className="text-gray-500">{apt.time}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300 text-sm">{apt.service}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300 text-sm">{apt.employee}</span>
                    </td>
                    <td className="p-4">
                      <span className={`${config.bgColor} ${config.textColor} border ${config.borderColor} px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1`}>
                        <span>{config.icon}</span>
                        {config.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {apt.daysUntil !== null && (
                        <span className="text-gray-400 text-sm">
                          {apt.daysUntil === 0 ? 'Hoje' : apt.daysUntil > 0 ? `${apt.daysUntil}d` : `há ${Math.abs(apt.daysUntil)}d`}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                          👁️
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                          ✏️
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
