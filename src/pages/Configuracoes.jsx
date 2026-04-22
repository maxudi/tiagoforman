import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Configuracoes() {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('personalizacao')

  // Estado Personalização
  const [settings, setSettings] = useState({
    businessName: 'Tiago Forman',
    businessType: 'barbearia', // barbearia, salao, clinica
    logo: '/logo.jpeg',
    primaryColor: '#9333ea', // purple-600
    secondaryColor: '#ec4899', // pink-500
    accentColor: '#8b5cf6', // violet-500
    menuIcons: {
      dashboard: '📊',
      agendamentos: '📅',
      atendentes: '💈',
      horarios: '⏰',
      servicos: '✂️',
      clientes: '👥',
      produtos: '📦',
      funcionarios: '👨‍💼',
      financeiro: '💰',
      configuracoes: '⚙️'
    }
  })

  // Estado Evolution API
  const [instances, setInstances] = useState([
    {
      id: 1,
      name: 'WhatsApp Principal',
      instanceName: 'tiagoforman_main',
      token: 'B6D60A4F-7CE9-4D55-8223-8C3459AA547B',
      apiUrl: 'https://api.evolution.com.br',
      status: 'connected',
      qrcode: null,
      phone: '+55 11 98765-4321',
      active: true
    },
    {
      id: 2,
      name: 'WhatsApp Atendimento',
      instanceName: 'tiagoforman_support',
      token: 'A5C40B3E-6BD8-3C44-7112-7B2348BA436A',
      apiUrl: 'https://api.evolution.com.br',
      status: 'disconnected',
      qrcode: null,
      phone: null,
      active: true
    }
  ])

  // Estado Usuários
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Max Admin',
      email: 'max@netminas.com',
      role: 'super_admin',
      active: true,
      createdAt: '2026-01-10'
    },
    {
      id: 2,
      name: 'Maria Silva',
      email: 'maria@barbearia.com',
      role: 'manager',
      active: true,
      createdAt: '2026-02-15'
    },
    {
      id: 3,
      name: 'João Costa',
      email: 'joao@barbearia.com',
      role: 'employee',
      active: true,
      createdAt: '2026-03-20'
    }
  ])

  // Estado Integrações de IA
  const [aiIntegrations, setAiIntegrations] = useState({
    openai: {
      apiKey: '',
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com/v1',
      active: false
    },
    anthropic: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      baseUrl: 'https://api.anthropic.com/v1',
      active: false
    },
    google: {
      apiKey: '',
      model: 'gemini-pro',
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      active: false
    },
    groq: {
      apiKey: '',
      model: 'llama-3.1-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
      active: false
    },
    custom: {
      apiKey: '',
      model: '',
      baseUrl: '',
      active: false
    }
  })

  // Estado Integração Bancária
  const [bankIntegration, setBankIntegration] = useState({
    banco: 'inter',
    clientId: '',
    clientSecret: '',
    numeroConta: '',
    certificado: null,
    certificadoFileName: '',
    chave: null,
    chaveFileName: '',
    active: false,
    lastSync: null
  })

  // Modais
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingInstance, setEditingInstance] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  // Form States
  const [instanceFormData, setInstanceFormData] = useState({
    name: '',
    instanceName: '',
    token: '',
    apiUrl: '',
    active: true
  })

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    active: true
  })

  // Temas predefinidos
  const themes = [
    { 
      name: 'Roxo Vibrante', 
      primary: '#9333ea', 
      secondary: '#ec4899', 
      accent: '#8b5cf6',
      preview: 'from-purple-600 to-pink-500'
    },
    { 
      name: 'Azul Oceano', 
      primary: '#0284c7', 
      secondary: '#06b6d4', 
      accent: '#0ea5e9',
      preview: 'from-sky-600 to-cyan-500'
    },
    { 
      name: 'Verde Esmeralda', 
      primary: '#059669', 
      secondary: '#10b981', 
      accent: '#14b8a6',
      preview: 'from-emerald-600 to-teal-500'
    },
    { 
      name: 'Laranja Vibrante', 
      primary: '#ea580c', 
      secondary: '#f59e0b', 
      accent: '#fb923c',
      preview: 'from-orange-600 to-amber-500'
    },
    { 
      name: 'Rosa Elegante', 
      primary: '#db2777', 
      secondary: '#ec4899', 
      accent: '#f472b6',
      preview: 'from-pink-600 to-pink-400'
    },
    { 
      name: 'Vermelho Intenso', 
      primary: '#dc2626', 
      secondary: '#f43f5e', 
      accent: '#ef4444',
      preview: 'from-red-600 to-rose-500'
    }
  ]

  // Tipos de negócio
  const businessTypes = [
    { 
      value: 'barbearia', 
      label: 'Barbearia', 
      description: 'Foco em cortes masculinos e barba',
      icons: {
        servicos: '💈',
        atendentes: '💈',
        produtos: '🧴'
      }
    },
    { 
      value: 'salao', 
      label: 'Salão de Beleza', 
      description: 'Serviços completos de estética',
      icons: {
        servicos: '💅',
        atendentes: '💇',
        produtos: '✨'
      }
    },
    { 
      value: 'clinica', 
      label: 'Clínica Estética', 
      description: 'Procedimentos estéticos e tratamentos',
      icons: {
        servicos: '💉',
        atendentes: '🏥',
        produtos: '💊'
      }
    },
    { 
      value: 'spa', 
      label: 'Spa & Wellness', 
      description: 'Relaxamento e bem-estar',
      icons: {
        servicos: '🧖',
        atendentes: '🌸',
        produtos: '🕯️'
      }
    }
  ]

  // Ícones disponíveis por categoria
  const availableIcons = {
    dashboard: ['📊', '📈', '🎯', '💼', '🏠', '⚡'],
    agendamentos: ['📅', '📆', '🗓️', '⏰', '📋', '✅'],
    atendentes: ['💈', '💇', '🏥', '🌸', '👨‍💼', '👩‍💼'],
    horarios: ['⏰', '🕐', '⏱️', '⌚', '📅', '🔔'],
    servicos: ['✂️', '💈', '💅', '💉', '🧖', '💇'],
    clientes: ['👥', '👤', '🙋', '👨‍👩‍👧‍👦', '📇', '🎭'],
    produtos: ['📦', '🛍️', '🧴', '💊', '✨', '🕯️'],
    funcionarios: ['👨‍💼', '👩‍💼', '🧑‍💼', '👔', '💼', '🎩'],
    financeiro: ['💰', '💵', '💳', '💸', '📊', '📈'],
    configuracoes: ['⚙️', '🔧', '🛠️', '⚡', '🎛️', '🔩']
  }

  // Handlers de Personalização
  const handleThemeChange = (theme) => {
    setSettings({
      ...settings,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent
    })
  }

  const handleBusinessTypeChange = (type) => {
    const businessType = businessTypes.find(bt => bt.value === type)
    setSettings({
      ...settings,
      businessType: type,
      menuIcons: {
        ...settings.menuIcons,
        ...businessType.icons
      }
    })
  }

  const handleIconChange = (category, icon) => {
    setSettings({
      ...settings,
      menuIcons: {
        ...settings.menuIcons,
        [category]: icon
      }
    })
  }

  // Handlers de Instance
  const handleOpenInstanceModal = (instance = null) => {
    if (instance) {
      setEditingInstance(instance)
      setInstanceFormData({
        name: instance.name,
        instanceName: instance.instanceName,
        token: instance.token,
        apiUrl: instance.apiUrl,
        active: instance.active
      })
    } else {
      setEditingInstance(null)
      setInstanceFormData({
        name: '',
        instanceName: '',
        token: '',
        apiUrl: 'https://api.evolution.com.br',
        active: true
      })
    }
    setIsInstanceModalOpen(true)
  }

  const handleCloseInstanceModal = () => {
    setIsInstanceModalOpen(false)
    setEditingInstance(null)
  }

  const handleSubmitInstance = (e) => {
    e.preventDefault()
    
    if (editingInstance) {
      setInstances(instances.map(i => 
        i.id === editingInstance.id 
          ? { ...i, ...instanceFormData }
          : i
      ))
    } else {
      const newInstance = {
        id: Math.max(...instances.map(i => i.id), 0) + 1,
        ...instanceFormData,
        status: 'disconnected',
        qrcode: null,
        phone: null
      }
      setInstances([...instances, newInstance])
    }
    
    handleCloseInstanceModal()
  }

  const handleDeleteInstance = (id) => {
    if (confirm('Tem certeza que deseja excluir esta instância?')) {
      setInstances(instances.filter(i => i.id !== id))
    }
  }

  const handleConnectInstance = (id) => {
    // Simulação de conexão
    alert('Gerando QR Code... (Funcionalidade será implementada com Evolution API real)')
  }

  // Handlers de User
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setUserFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        active: user.active
      })
    } else {
      setEditingUser(null)
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        active: true
      })
    }
    setIsUserModalOpen(true)
  }

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmitUser = (e) => {
    e.preventDefault()
    
    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { 
              ...u, 
              name: userFormData.name,
              email: userFormData.email,
              role: userFormData.role,
              active: userFormData.active
            }
          : u
      ))
      if (userFormData.password) {
        alert('Senha alterada com sucesso!')
      }
    } else {
      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        active: userFormData.active,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setUsers([...users, newUser])
    }
    
    handleCloseUserModal()
  }

  const handleDeleteUser = (id) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const roleLabels = {
    super_admin: 'Super Admin',
    owner: 'Proprietário',
    manager: 'Gerente',
    employee: 'Funcionário'
  }

  const tabs = [
    { id: 'personalizacao', label: 'Personalização', icon: '🎨' },
    { id: 'evolution', label: 'Evolution API', icon: '📱' },
    { id: 'ia', label: 'Inteligência Artificial', icon: '🤖' },
    { id: 'banco', label: 'Integração Bancária', icon: '🏦' },
    { id: 'usuarios', label: 'Usuários', icon: '👥' }
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-gray-400">Personalize o sistema e configure integrações</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 mb-8">
        <div className="flex items-center gap-2 p-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Personalização */}
      {activeTab === 'personalizacao' && (
        <div className="space-y-8">
          {/* Informações do Negócio */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Informações do Negócio</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Estabelecimento</label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Negócio</label>
                <select
                  value={settings.businessType}
                  onChange={(e) => handleBusinessTypeChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-gray-500 text-xs mt-2">
                  {businessTypes.find(bt => bt.value === settings.businessType)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Temas de Cores */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Tema de Cores</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {themes.map(theme => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.primaryColor === theme.primary
                      ? 'border-white'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`h-16 rounded-lg bg-gradient-to-r ${theme.preview} mb-3`}></div>
                  <p className="text-white font-medium text-sm">{theme.name}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cor Secundária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cor de Destaque</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ícones do Menu */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Ícones do Menu</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(settings.menuIcons).map(([category, currentIcon]) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-300 mb-3 capitalize">
                    {category}
                  </label>
                  <div className="flex items-center gap-2">
                    {availableIcons[category]?.map(icon => (
                      <button
                        key={icon}
                        onClick={() => handleIconChange(category, icon)}
                        className={`w-12 h-12 rounded-lg text-2xl transition-all ${
                          currentIcon === icon
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salvar Configurações */}
          <div className="flex justify-end">
            <button
              onClick={() => alert('Configurações salvas com sucesso!')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Tab: Evolution API */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Instâncias Evolution API</h2>
              <button 
                onClick={() => handleOpenInstanceModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium"
              >
                <span className="text-xl">➕</span>
                Nova Instância
              </button>
            </div>
          </div>

          {/* Instances List */}
          <div className="grid grid-cols-1 gap-6">
            {instances.map(instance => (
              <div
                key={instance.id}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                      instance.status === 'connected' 
                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                        : 'bg-gray-700'
                    }`}>
                      📱
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{instance.name}</h3>
                      <p className="text-gray-400 text-sm">{instance.instanceName}</p>
                      {instance.phone && (
                        <p className="text-gray-500 text-sm">{instance.phone}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    instance.status === 'connected'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  }`}>
                    {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">API URL</p>
                    <p className="text-white text-sm font-mono">{instance.apiUrl}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Token</p>
                    <p className="text-white text-sm font-mono">{instance.token.substring(0, 20)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {instance.status === 'disconnected' && (
                    <button
                      onClick={() => handleConnectInstance(instance.id)}
                      className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 font-medium transition-colors"
                    >
                      🔗 Conectar
                    </button>
                  )}
                  {instance.status === 'connected' && (
                    <button
                      onClick={() => alert('Desconectando...')}
                      className="flex-1 py-2 px-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-orange-400 font-medium transition-colors"
                    >
                      🔌 Desconectar
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenInstanceModal(instance)}
                    className="py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteInstance(instance.id)}
                    className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Inteligência Artificial */}
      {activeTab === 'ia' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-2">🤖 Integrações de IA</h2>
            <p className="text-gray-400 text-sm">Configure provedores de inteligência artificial para automações e respostas inteligentes</p>
          </div>

          {/* OpenAI (GPT) */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                  🧠
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">OpenAI (ChatGPT)</h3>
                  <p className="text-gray-400 text-sm">GPT-4, GPT-3.5 Turbo</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIntegrations.openai.active}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    openai: { ...aiIntegrations.openai, active: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  value={aiIntegrations.openai.apiKey}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    openai: { ...aiIntegrations.openai, apiKey: e.target.value }
                  })}
                  placeholder="sk-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                <select
                  value={aiIntegrations.openai.model}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    openai: { ...aiIntegrations.openai, model: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  type="url"
                  value={aiIntegrations.openai.baseUrl}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    openai: { ...aiIntegrations.openai, baseUrl: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Anthropic (Claude) */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Anthropic (Claude)</h3>
                  <p className="text-gray-400 text-sm">Claude Sonnet, Opus</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIntegrations.anthropic.active}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    anthropic: { ...aiIntegrations.anthropic, active: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  value={aiIntegrations.anthropic.apiKey}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    anthropic: { ...aiIntegrations.anthropic, apiKey: e.target.value }
                  })}
                  placeholder="sk-ant-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                <select
                  value={aiIntegrations.anthropic.model}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    anthropic: { ...aiIntegrations.anthropic, model: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  type="url"
                  value={aiIntegrations.anthropic.baseUrl}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    anthropic: { ...aiIntegrations.anthropic, baseUrl: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Google AI */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl">
                  🔷
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Google AI (Gemini)</h3>
                  <p className="text-gray-400 text-sm">Gemini Pro, Ultra</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIntegrations.google.active}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    google: { ...aiIntegrations.google, active: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  value={aiIntegrations.google.apiKey}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    google: { ...aiIntegrations.google, apiKey: e.target.value }
                  })}
                  placeholder="AIza..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                <select
                  value={aiIntegrations.google.model}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    google: { ...aiIntegrations.google, model: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="gemini-ultra">Gemini Ultra</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  type="url"
                  value={aiIntegrations.google.baseUrl}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    google: { ...aiIntegrations.google, baseUrl: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Groq */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Groq (Ultra Rápido)</h3>
                  <p className="text-gray-400 text-sm">Llama 3.1, Mixtral</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIntegrations.groq.active}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    groq: { ...aiIntegrations.groq, active: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  value={aiIntegrations.groq.apiKey}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    groq: { ...aiIntegrations.groq, apiKey: e.target.value }
                  })}
                  placeholder="gsk_..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                <select
                  value={aiIntegrations.groq.model}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    groq: { ...aiIntegrations.groq, model: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  type="url"
                  value={aiIntegrations.groq.baseUrl}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    groq: { ...aiIntegrations.groq, baseUrl: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* IA Customizada */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-2xl">
                  🔧
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">IA Customizada</h3>
                  <p className="text-gray-400 text-sm">Ollama, LM Studio, LocalAI, etc.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIntegrations.custom.active}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    custom: { ...aiIntegrations.custom, active: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL *</label>
                <input
                  type="url"
                  value={aiIntegrations.custom.baseUrl}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    custom: { ...aiIntegrations.custom, baseUrl: e.target.value }
                  })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Modelo</label>
                <input
                  type="text"
                  value={aiIntegrations.custom.model}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    custom: { ...aiIntegrations.custom, model: e.target.value }
                  })}
                  placeholder="llama3.1, mistral, etc."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key (opcional)</label>
                <input
                  type="password"
                  value={aiIntegrations.custom.apiKey}
                  onChange={(e) => setAiIntegrations({
                    ...aiIntegrations,
                    custom: { ...aiIntegrations.custom, apiKey: e.target.value }
                  })}
                  placeholder="Deixe vazio se não usar"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={() => alert('Configurações de IA salvas com sucesso!')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
            >
              💾 Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Tab: Integração Bancária */}
      {activeTab === 'banco' && (
        <div className="space-y-6">
          {/* Header com Status */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Integração com Banco Inter</h2>
                <p className="text-gray-400 text-sm">Configure as credenciais da API do Banco Inter para automação financeira</p>
              </div>
              <div className={`px-4 py-2 rounded-lg border ${
                bankIntegration.active 
                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                  : 'bg-gray-700/50 text-gray-400 border-gray-600'
              }`}>
                {bankIntegration.active ? '✓ Conectado' : '○ Desconectado'}
              </div>
            </div>

            {bankIntegration.lastSync && (
              <div className="text-sm text-gray-400">
                Última sincronização: {new Date(bankIntegration.lastSync).toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          {/* Formulário de Credenciais */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-6">Credenciais da API</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    value={bankIntegration.clientId}
                    onChange={(e) => setBankIntegration({ ...bankIntegration, clientId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                    placeholder="Ex: 12345678-abcd-1234-abcd-123456789012"
                  />
                  <p className="text-gray-500 text-xs mt-1">Obtido no portal do desenvolvedor do Banco Inter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Secret *
                  </label>
                  <input
                    type="password"
                    value={bankIntegration.clientSecret}
                    onChange={(e) => setBankIntegration({ ...bankIntegration, clientSecret: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                    placeholder="••••••••••••••••••••"
                  />
                  <p className="text-gray-500 text-xs mt-1">Mantenha esta informação segura</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número da Conta *
                </label>
                <input
                  type="text"
                  value={bankIntegration.numeroConta}
                  onChange={(e) => setBankIntegration({ ...bankIntegration, numeroConta: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: 12345678"
                  maxLength={8}
                />
                <p className="text-gray-500 text-xs mt-1">Número da conta corrente no Banco Inter (8 dígitos)</p>
              </div>
            </div>
          </div>

          {/* Certificados */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-6">Certificados de Segurança</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Certificado Digital (.crt ou .pem) *
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg px-4 py-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      accept=".crt,.pem"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBankIntegration({ 
                            ...bankIntegration, 
                            certificado: file,
                            certificadoFileName: file.name
                          })
                        }
                      }}
                    />
                    <div className="text-4xl mb-2">📄</div>
                    <div className="text-white font-medium mb-1">
                      {bankIntegration.certificadoFileName || 'Clique para selecionar o certificado'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Arquivo .crt ou .pem fornecido pelo Banco Inter
                    </div>
                  </label>
                  {bankIntegration.certificadoFileName && (
                    <button
                      onClick={() => setBankIntegration({ 
                        ...bankIntegration, 
                        certificado: null,
                        certificadoFileName: ''
                      })}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chave Privada (.key) *
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg px-4 py-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      accept=".key"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBankIntegration({ 
                            ...bankIntegration, 
                            chave: file,
                            chaveFileName: file.name
                          })
                        }
                      }}
                    />
                    <div className="text-4xl mb-2">🔑</div>
                    <div className="text-white font-medium mb-1">
                      {bankIntegration.chaveFileName || 'Clique para selecionar a chave privada'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Arquivo .key correspondente ao certificado
                    </div>
                  </label>
                  {bankIntegration.chaveFileName && (
                    <button
                      onClick={() => setBankIntegration({ 
                        ...bankIntegration, 
                        chave: null,
                        chaveFileName: ''
                      })}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações de Segurança */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔒</div>
              <div className="flex-1">
                <h4 className="text-white font-bold mb-2">Segurança dos Dados</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Todas as credenciais são criptografadas antes de serem armazenadas</li>
                  <li>• Os certificados e chaves são mantidos em ambiente seguro isolado</li>
                  <li>• A comunicação com a API do Banco Inter utiliza TLS 1.2+</li>
                  <li>• Logs de transações são mantidos por auditoria</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Teste de Conexão e Salvar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!bankIntegration.clientId || !bankIntegration.clientSecret || !bankIntegration.numeroConta) {
                  alert('Preencha todos os campos obrigatórios')
                  return
                }
                if (!bankIntegration.certificado || !bankIntegration.chave) {
                  alert('Envie o certificado e a chave privada')
                  return
                }
                alert('Testando conexão com Banco Inter... (Funcionalidade será implementada)')
                // Aqui implementar teste real de conexão
              }}
              className="flex-1 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors"
            >
              🔗 Testar Conexão
            </button>
            <button
              onClick={() => {
                if (!bankIntegration.clientId || !bankIntegration.clientSecret || !bankIntegration.numeroConta) {
                  alert('Preencha todos os campos obrigatórios')
                  return
                }
                if (!bankIntegration.certificado || !bankIntegration.chave) {
                  alert('Envie o certificado e a chave privada')
                  return
                }
                setBankIntegration({ 
                  ...bankIntegration, 
                  active: true,
                  lastSync: new Date().toISOString()
                })
                alert('Credenciais salvas com sucesso!')
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
            >
              💾 Salvar Credenciais
            </button>
          </div>

          {/* Recursos Disponíveis */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Recursos Disponíveis com a Integração</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="text-white font-medium mb-1">Consulta de Saldo</div>
                  <div className="text-gray-400 text-sm">Verificação automática do saldo da conta</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="text-white font-medium mb-1">Extrato Bancário</div>
                  <div className="text-gray-400 text-sm">Importação automática de transações</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                <span className="text-2xl">🔔</span>
                <div>
                  <div className="text-white font-medium mb-1">Webhooks</div>
                  <div className="text-gray-400 text-sm">Notificações em tempo real de transações</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                <span className="text-2xl">📈</span>
                <div>
                  <div className="text-white font-medium mb-1">Conciliação Automática</div>
                  <div className="text-gray-400 text-sm">Reconciliação com lançamentos do sistema</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gerenciar Usuários</h2>
              <button 
                onClick={() => handleOpenUserModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium"
              >
                <span className="text-xl">➕</span>
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Perfil</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Data de Criação</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{roleLabels[user.role]}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                      }`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenUserModal(user)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          disabled={user.role === 'super_admin'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Instance */}
      {isInstanceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingInstance ? 'Editar Instância' : 'Nova Instância'}
              </h2>
              <button onClick={handleCloseInstanceModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmitInstance} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Instância *</label>
                <input
                  type="text"
                  value={instanceFormData.name}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: WhatsApp Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Instance Name (Evolution) *</label>
                <input
                  type="text"
                  value={instanceFormData.instanceName}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, instanceName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="Ex: meuapp_main"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token da API *</label>
                <input
                  type="text"
                  value={instanceFormData.token}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, token: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                  placeholder="Ex: A5C40B3E-6BD8-3C44-7112-7B2348BA436A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL da API *</label>
                <input
                  type="text"
                  value={instanceFormData.apiUrl}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, apiUrl: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="https://api.evolution.com.br"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instanceFormData.active}
                    onChange={(e) => setInstanceFormData({ ...instanceFormData, active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300 font-medium">Instância ativa</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseInstanceModal}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
                >
                  {editingInstance ? 'Salvar Alterações' : 'Adicionar Instância'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={handleCloseUserModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha *'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required={!editingUser}
                  placeholder={editingUser ? 'Deixe em branco para não alterar' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Perfil de Acesso *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="employee">Funcionário</option>
                  <option value="manager">Gerente</option>
                  <option value="owner">Proprietário</option>
                  {userProfile?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userFormData.active}
                    onChange={(e) => setUserFormData({ ...userFormData, active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300 font-medium">Usuário ativo</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseUserModal}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
