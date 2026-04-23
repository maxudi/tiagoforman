import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppointmentNotifier from './AppointmentNotifier'

export default function AdminLayout({ children }) {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/agendamentos', label: 'Agendamentos', icon: '📅' },
    { path: '/admin/atendentes', label: 'Atendentes', icon: '💈' },
    { path: '/admin/horarios', label: 'Horários', icon: '⏰' },
    { path: '/admin/servicos', label: 'Serviços', icon: '✂️' },
    { path: '/admin/clientes', label: 'Clientes', icon: '👥' },
    { path: '/admin/produtos', label: 'Produtos', icon: '🛍️' },
    { path: '/admin/funcionarios', label: 'Funcionários', icon: '👨‍💼' },
    { path: '/admin/financeiro', label: 'Financeiro', icon: '💰' },
    { path: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
    { path: '/admin/avaliacoes', label: 'Avaliações', icon: '⭐' },
    { path: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-30">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left: toggle + logo */}
            <div className="flex items-center gap-3">
              {/* Collapse toggle button */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors flex-shrink-0"
                title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {collapsed
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                  }
                </svg>
              </button>
              <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" />
              <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-xl font-bold text-white whitespace-nowrap">Tiago Forman</h1>
                <p className="text-xs text-gray-400 whitespace-nowrap">Painel Administrativo</p>
              </div>
            </div>

            {/* Right: user + logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {userProfile?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Sair"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            flex-shrink-0 min-h-[calc(100vh-4rem)] bg-gray-900/30 border-r border-gray-800
            transition-all duration-300 ease-in-out
            ${collapsed ? 'w-16' : 'w-64'}
          `}
        >
          <nav className={`p-2 space-y-1 ${collapsed ? 'px-2' : 'p-4'}`}>
            {menuItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg transition-colors ${
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                  } ${
                    active
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Notificações de novos agendamentos (realtime) */}
      <AppointmentNotifier />
    </div>
  )
}
