import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ImageUpload from '../components/ImageUpload'

export default function Funcionarios() {
  const { userProfile } = useAuth()
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'receptionist',
    email: '',
    phone: '',
    cpf: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    department: '',
    avatarUrl: ''
  })

  const roles = [
    { value: 'manager', label: 'Gerente' },
    { value: 'receptionist', label: 'Recepcionista' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'employee', label: 'Funcionário Geral' }
  ]

  // Máscara de telefone
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    } else {
      return cleaned.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
    }
  }

  // Máscara de CPF
  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14)
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value)
    setFormData({ ...formData, cpf: formatted })
  }

  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchFuncionarios()
    }
  }, [userProfile])

  const fetchFuncionarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('first_name')

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (funcionario = null) => {
    if (funcionario) {
      setEditingFuncionario(funcionario)
      setFormData({
        firstName: funcionario.first_name,
        lastName: funcionario.last_name,
        role: funcionario.role,
        email: funcionario.email || '',
        phone: formatPhone(funcionario.phone || ''),
        cpf: formatCPF(funcionario.cpf || ''),
        hireDate: funcionario.hire_date || new Date().toISOString().split('T')[0],
        salary: funcionario.salary || '',
        department: funcionario.department || '',
        avatarUrl: funcionario.avatar_url || ''
      })
    } else {
      setEditingFuncionario(null)
      setFormData({
        firstName: '',
        lastName: '',
        role: 'receptionist',
        email: '',
        phone: '',
        cpf: '',
        hireDate: new Date().toISOString().split('T')[0],
        salary: '',
        department: '',
        avatarUrl: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFuncionario(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const funcionarioData = {
        organization_id: userProfile.organization_id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        email: formData.email || null,
        phone: formData.phone.replace(/\D/g, '') || null,
        cpf: formData.cpf.replace(/\D/g, '') || null,
        hire_date: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        department: formData.department || null,
        avatar_url: formData.avatarUrl || null,
        is_active: true
      }

      if (editingFuncionario) {
        const { error } = await supabase
          .from('employees')
          .update(funcionarioData)
          .eq('id', editingFuncionario.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([funcionarioData])

        if (error) throw error
      }

      await fetchFuncionarios()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error)
      alert('Erro ao salvar funcionário: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchFuncionarios()
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error)
      alert('Erro ao excluir funcionário: ' + error.message)
    }
  }

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? roleObj.label : role
  }

  const stats = [
    {
      label: 'Total de Funcionários',
      value: funcionarios.length,
      icon: '👥',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Ativos',
      value: funcionarios.filter(f => f.is_active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Gerentes',
      value: funcionarios.filter(f => f.role === 'manager').length,
      icon: '👔',
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Recepcionistas',
      value: funcionarios.filter(f => f.role === 'receptionist').length,
      icon: '📞',
      color: 'from-amber-500 to-amber-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando funcionários...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Funcionários</h1>
        <p className="text-gray-400">Gerencie a equipe administrativa</p>
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
            <p className="text-white text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Lista de Funcionários</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Funcionários Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {funcionarios.map(funcionario => (
          <div
            key={funcionario.id}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              {funcionario.avatar_url ? (
                <img
                  src={funcionario.avatar_url}
                  alt={`${funcionario.first_name} ${funcionario.last_name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {funcionario.first_name?.[0]}{funcionario.last_name?.[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">
                  {funcionario.first_name} {funcionario.last_name}
                </h3>
                <p className="text-purple-400 text-sm font-medium">{getRoleLabel(funcionario.role)}</p>
                {funcionario.department && (
                  <p className="text-gray-500 text-xs">{funcionario.department}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {funcionario.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">📧</span>
                  <span className="text-gray-300">{funcionario.email}</span>
                </div>
              )}
              {funcionario.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">📱</span>
                  <span className="text-gray-300">{formatPhone(funcionario.phone)}</span>
                </div>
              )}
              {funcionario.hire_date && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">📅</span>
                  <span className="text-gray-300">
                    Desde {new Date(funcionario.hire_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenModal(funcionario)}
                className="flex-1 py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(funcionario.id)}
                className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {funcionarios.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum funcionário cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Avatar */}
              <ImageUpload
                currentImageUrl={formData.avatarUrl}
                onImageUploaded={(url) => setFormData({ ...formData, avatarUrl: url })}
                bucket="images"
                folder="avatars"
                label="Foto do Funcionário"
              />

              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Dados Pessoais</h3>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={handleCPFChange}
                      placeholder="123.456.789-00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Dados Profissionais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cargo *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Departamento</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Administrativo, Atendimento..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data de Contratação *</label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Salário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
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
                  {editingFuncionario ? 'Salvar Alterações' : 'Adicionar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
