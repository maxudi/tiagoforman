import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Servicos() {
  const { userProfile } = useAuth()
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingServico, setEditingServico] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: '',
    active: true,
    icon: '✂️'
  })

  const categorias = ['Cabelo', 'Barba', 'Combo', 'Coloração', 'Tratamentos', 'Outros']
  const iconsDisponiveis = ['✂️', '🧔', '💈', '🎨', '✨', '💇', '🪒', '💆', '🧴', '💅']
  const duracaoOptions = [15, 20, 30, 40, 45, 60, 90, 120]

  // Carregar serviços do banco
  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchServicos()
    }
  }, [userProfile])

  const fetchServicos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('name')

      if (error) throw error
      
      // Transformar dados do banco para o formato do frontend
      const servicosFormatados = data.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        duration: s.duration_minutes,
        price: parseFloat(s.price),
        category: s.category || 'Outros',
        active: s.is_active,
        icon: s.metadata?.icon || '✂️' // Armazenamos o ícone no metadata
      }))

      setServicos(servicosFormatados)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      alert('Erro ao carregar serviços: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (servico = null) => {
    if (servico) {
      setEditingServico(servico)
      setFormData({
        name: servico.name,
        description: servico.description,
        duration: servico.duration,
        price: servico.price,
        category: servico.category,
        active: servico.active,
        icon: servico.icon
      })
    } else {
      setEditingServico(null)
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        category: '',
        active: true,
        icon: '✂️'
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingServico(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const servicoData = {
        organization_id: userProfile.organization_id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        duration_minutes: formData.duration,
        price: formData.price,
        is_active: formData.active,
        metadata: { icon: formData.icon }
      }

      if (editingServico) {
        // Atualizar
        const { error } = await supabase
          .from('services')
          .update(servicoData)
          .eq('id', editingServico.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('services')
          .insert([servicoData])

        if (error) throw error
      }

      await fetchServicos()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      alert('Erro ao salvar serviço: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchServicos()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      alert('Erro ao excluir serviço: ' + error.message)
    }
  }

  const getServicosByCategory = (category) => {
    return servicos.filter(s => s.category === category)
  }

  const stats = [
    {
      label: 'Total de Serviços',
      value: servicos.length,
      icon: '💼',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Serviços Ativos',
      value: servicos.filter(s => s.active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Receita Média',
      value: servicos.length > 0 ? `R$ ${(servicos.reduce((sum, s) => sum + s.price, 0) / servicos.length).toFixed(2)}` : 'R$ 0,00',
      icon: '💰',
      color: 'from-amber-500 to-amber-600'
    },
    {
      label: 'Duração Média',
      value: servicos.length > 0 ? `${Math.round(servicos.reduce((sum, s) => sum + s.duration, 0) / servicos.length)}min` : '0min',
      icon: '⏱️',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando serviços...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Serviços</h1>
        <p className="text-gray-400">Gerencie os serviços oferecidos pela barbearia</p>
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
          <h2 className="text-xl font-bold text-white">Lista de Serviços</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Serviço
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map(servico => (
          <div
            key={servico.id}
            className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border transition-all ${
              servico.active 
                ? 'border-gray-800 hover:border-purple-500/50' 
                : 'border-gray-800/50 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                  servico.active 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-gray-700'
                }`}>
                  {servico.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{servico.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    servico.active 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  }`}>
                    {servico.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{servico.description}</p>

            {/* Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">💰</span>
                  <span className="text-gray-300 text-sm">Preço</span>
                </div>
                <span className="text-green-400 font-bold text-lg">
                  R$ {servico.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">⏱️</span>
                  <span className="text-gray-300 text-sm">Duração</span>
                </div>
                <span className="text-purple-400 font-bold">
                  {servico.duration}min
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📂</span>
                  <span className="text-gray-300 text-sm">Categoria</span>
                </div>
                <span className="text-blue-400 font-medium text-sm">
                  {servico.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
              <button
                onClick={() => handleOpenModal(servico)}
                className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-medium transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(servico.id)}
                className="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-colors"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: Corte Masculino"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none h-24 resize-none"
                  placeholder="Descreva o serviço..."
                />
              </div>

              {/* Categoria e Ícone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ícone
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconsDisponiveis.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`h-12 rounded-lg text-2xl transition-all ${
                          formData.icon === icon
                            ? 'bg-purple-500/30 border-2 border-purple-500'
                            : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preço e Duração */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duração (minutos) *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {duracaoOptions.map(dur => (
                      <option key={dur} value={dur}>{dur} min</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300 font-medium">Serviço ativo</span>
                </label>
                <p className="text-gray-500 text-xs mt-2 ml-8">
                  Serviços inativos não aparecem para agendamento
                </p>
              </div>

              {/* Actions */}
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
                  {editingServico ? 'Salvar Alterações' : 'Adicionar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
