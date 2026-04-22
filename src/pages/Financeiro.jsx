import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Financeiro() {
  const { userProfile } = useAuth()
  const [transacoes, setTransacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    type: 'entrada',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  })

  const meses = [
    { value: 'all', label: 'Todos os Meses' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  const anos = [
    { value: 'all', label: 'Todos os Anos' },
    { value: 2026, label: '2026' },
    { value: 2025, label: '2025' },
    { value: 2024, label: '2024' },
    { value: 2023, label: '2023' }
  ]

  const categoriesEntrada = ['Produto', 'Serviço Avulso', 'Outros']
  const categoriesSaida = ['Salário', 'Aluguel', 'Conta', 'Fornecedor', 'Imposto', 'Manutenção', 'Marketing', 'Outros']
  const paymentMethods = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'bank_transfer', label: 'Transferência' },
    { value: 'other', label: 'Outros' }
  ]

  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchTransacoes()
    }
  }, [userProfile, selectedMonth, selectedYear])

  const fetchTransacoes = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
      
      // Aplicar filtros de data
      if (selectedYear !== 'all') {
        if (selectedMonth !== 'all') {
          // Filtro específico: mês e ano
          const monthStr = String(selectedMonth).padStart(2, '0')
          const startDate = `${selectedYear}-${monthStr}-01`
          const endDate = `${selectedYear}-${monthStr}-31`
          query = query.gte('paid_at', startDate).lte('paid_at', endDate)
        } else {
          // Filtro: ano inteiro
          const startDate = `${selectedYear}-01-01`
          const endDate = `${selectedYear}-12-31`
          query = query.gte('paid_at', startDate).lte('paid_at', endDate)
        }
      }
      // Se selectedYear === 'all' e selectedMonth === 'all', busca tudo (sem filtro)
      
      const { data, error } = await query.order('paid_at', { ascending: false })

      if (error) throw error

      // Transformar dados para o formato da UI
      const transacoesFormatadas = (data || []).map(payment => ({
        id: payment.id,
        type: payment.amount >= 0 ? 'entrada' : 'saida',
        category: payment.metadata?.category || 'Outros',
        description: payment.metadata?.description || 'Sem descrição',
        amount: Math.abs(payment.amount),
        date: payment.paid_at ? payment.paid_at.split('T')[0] : '',
        paymentMethod: payment.payment_method,
        automatic: payment.appointment_id != null
      }))

      setTransacoes(transacoesFormatadas)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (transacao = null) => {
    if (transacao) {
      setEditingTransacao(transacao)
      setFormData({
        type: transacao.type,
        category: transacao.category,
        description: transacao.description,
        amount: transacao.amount,
        date: transacao.date,
        paymentMethod: transacao.paymentMethod
      })
    } else {
      setEditingTransacao(null)
      setFormData({
        type: 'entrada',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash'
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransacao(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Calcular valor (negativo para saída, positivo para entrada)
      const valorFinal = formData.type === 'entrada' ? formData.amount : -formData.amount

      const paymentData = {
        organization_id: userProfile.organization_id,
        amount: valorFinal,
        payment_method: formData.paymentMethod,
        payment_status: 'paid',
        paid_at: new Date(formData.date).toISOString(),
        metadata: {
          category: formData.category,
          description: formData.description,
          manual: true
        }
      }

      if (editingTransacao) {
        const { error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', editingTransacao.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payments')
          .insert([paymentData])

        if (error) throw error
      }

      await fetchTransacoes()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    const transacao = transacoes.find(t => t.id === id)
    if (transacao?.automatic) {
      alert('Não é possível excluir transações automáticas de agendamentos')
      return
    }
    
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchTransacoes()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação: ' + error.message)
    }
  }

  // Cálculos
  const totalEntradas = transacoes.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0)
  const totalSaidas = transacoes.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0)
  const saldo = totalEntradas - totalSaidas

  const stats = [
    {
      label: 'Total de Entradas',
      value: `R$ ${totalEntradas.toFixed(2)}`,
      icon: '📈',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Total de Saídas',
      value: `R$ ${totalSaidas.toFixed(2)}`,
      icon: '📉',
      color: 'from-red-500 to-red-600'
    },
    {
      label: selectedMonth === 'all' ? 'Saldo Total' : 'Saldo do Período',
      value: `R$ ${saldo.toFixed(2)}`,
      icon: '💰',
      color: saldo >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
    },
    {
      label: 'Total de Transações',
      value: transacoes.length,
      icon: '📊',
      color: 'from-blue-500 to-blue-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando transações...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
        <p className="text-gray-400">Controle de receitas e despesas</p>
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Transações</h2>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {anos.map(ano => (
                <option key={ano.value} value={ano.value}>{ano.label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Nova Transação
          </button>
        </div>
      </div>

      {/* Transações Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Data</th>
              <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
              <th className="text-left p-4 text-gray-400 font-medium">Categoria</th>
              <th className="text-left p-4 text-gray-400 font-medium">Descrição</th>
              <th className="text-left p-4 text-gray-400 font-medium">Método</th>
              <th className="text-right p-4 text-gray-400 font-medium">Valor</th>
              <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transacoes.map(transacao => (
              <tr key={transacao.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <span className="text-white">
                    {new Date(transacao.date).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transacao.type === 'entrada'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {transacao.type === 'entrada' ? '↗ Entrada' : '↘ Saída'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-gray-300">{transacao.category}</span>
                </td>
                <td className="p-4">
                  <div>
                    <span className="text-white">{transacao.description}</span>
                    {transacao.automatic && (
                      <span className="ml-2 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Auto</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-400 text-sm">
                    {paymentMethods.find(m => m.value === transacao.paymentMethod)?.label || transacao.paymentMethod}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className={`font-bold ${
                    transacao.type === 'entrada' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transacao.type === 'entrada' ? '+' : '-'} R$ {transacao.amount.toFixed(2)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {!transacao.automatic && (
                      <>
                        <button 
                          onClick={() => handleOpenModal(transacao)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(transacao.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {transacoes.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhuma transação neste mês</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingTransacao ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione</option>
                    {(formData.type === 'entrada' ? categoriesEntrada : categoriesSaida).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
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
                  {editingTransacao ? 'Salvar Alterações' : 'Adicionar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
