import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Clientes() {
  const { userProfile } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [viewingCliente, setViewingCliente] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    addressStreet: '',
    addressCity: '',
    notes: ''
  })

  // Máscara de telefone brasileira
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '')
    
    if (cleaned.length <= 10) {
      // (XX) XXXX-XXXX
      return cleaned
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    } else {
      // (XX) XXXXX-XXXX
      return cleaned
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15)
    }
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  // Carregar clientes do Supabase
  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchClientes()
    }
  }, [userProfile])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('first_name')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        firstName: cliente.first_name,
        lastName: cliente.last_name,
        email: cliente.email || '',
        phone: formatPhone(cliente.phone),
        dateOfBirth: cliente.date_of_birth || '',
        addressStreet: cliente.address_street || '',
        addressCity: cliente.address_city || '',
        notes: cliente.notes || ''
      })
    } else {
      setEditingCliente(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        addressStreet: '',
        addressCity: '',
        notes: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCliente(null)
    setViewingCliente(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const clienteData = {
        organization_id: userProfile.organization_id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone.replace(/\D/g, ''), // Remove formatação antes de salvar
        date_of_birth: formData.dateOfBirth || null,
        address_street: formData.addressStreet || null,
        address_city: formData.addressCity || null,
        notes: formData.notes || null,
        is_active: true
      }

      if (editingCliente) {
        const { error } = await supabase
          .from('customers')
          .update(clienteData)
          .eq('id', editingCliente.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([clienteData])

        if (error) throw error
      }

      await fetchClientes()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchClientes()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente: ' + error.message)
    }
  }

  const stats = [
    {
      label: 'Total de Clientes',
      value: clientes.length,
      icon: '👥',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Clientes Ativos',
      value: clientes.filter(c => c.is_active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Receita Total',
      value: `R$ ${clientes.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}`,
      icon: '💰',
      color: 'from-amber-500 to-amber-600'
    },
    {
      label: 'Total de Visitas',
      value: clientes.reduce((sum, c) => sum + (c.total_appointments || 0), 0),
      icon: '📊',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
        <p className="text-gray-400">Gerencie sua base de clientes</p>
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
          <h2 className="text-xl font-bold text-white">Lista de Clientes</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Clientes Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
              <th className="text-left p-4 text-gray-400 font-medium">Contato</th>
              <th className="text-left p-4 text-gray-400 font-medium">Aniversário</th>
              <th className="text-left p-4 text-gray-400 font-medium">Última Visita</th>
              <th className="text-left p-4 text-gray-400 font-medium">Agendamentos</th>
              <th className="text-left p-4 text-gray-400 font-medium">Total Gasto</th>
              <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clientes.map(cliente => (
              <tr key={cliente.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="text-white font-medium">{cliente.first_name} {cliente.last_name}</p>
                    <p className="text-gray-500 text-sm">{cliente.address_city || 'N/A'}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <p className="text-gray-300">{cliente.email || 'N/A'}</p>
                    <p className="text-gray-500">{formatPhone(cliente.phone)}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-300 text-sm">
                    {cliente.date_of_birth ? new Date(cliente.date_of_birth).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-gray-300 text-sm">
                    {cliente.last_appointment_at ? new Date(cliente.last_appointment_at).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-white font-medium">{cliente.total_appointments || 0}</span>
                </td>
                <td className="p-4">
                  <span className="text-green-400 font-medium">
                    R$ {(cliente.total_spent || 0).toFixed(2)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setViewingCliente(cliente)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      👁️
                    </button>
                    <button 
                      onClick={() => handleOpenModal(cliente)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(cliente.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
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

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sobrenome *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Endereço</label>
                  <input
                    type="text"
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none h-24 resize-none"
                  />
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
                  {editingCliente ? 'Salvar Alterações' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização */}
      {viewingCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Cliente</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Nome</p>
                  <p className="text-white font-medium">{viewingCliente.first_name} {viewingCliente.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    viewingCliente.is_active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  }`}>
                    {viewingCliente.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white">{viewingCliente.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Telefone</p>
                  <p className="text-white">{formatPhone(viewingCliente.phone)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Data de Nascimento</p>
                  <p className="text-white">{viewingCliente.date_of_birth ? new Date(viewingCliente.date_of_birth).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Cidade</p>
                  <p className="text-white">{viewingCliente.address_city || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Endereço</p>
                  <p className="text-white">{viewingCliente.address_street || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm mb-1">Total Agendamentos</p>
                  <p className="text-white text-2xl font-bold">{viewingCliente.total_appointments || 0}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 text-sm mb-1">Total Gasto</p>
                  <p className="text-white text-2xl font-bold">R$ {(viewingCliente.total_spent || 0).toFixed(2)}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-400 text-sm mb-1">Última Visita</p>
                  <p className="text-white text-lg font-bold">
                    {viewingCliente.last_appointment_at ? new Date(viewingCliente.last_appointment_at).toLocaleDateString('pt-BR') : 'Nunca'}
                  </p>
                </div>
              </div>

              {viewingCliente.notes && (
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Observações</p>
                  <p className="text-white">{viewingCliente.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
