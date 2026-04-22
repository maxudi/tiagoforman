import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ImageUpload from '../components/ImageUpload'

export default function Produtos() {
  const { userProfile } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    category: '',
    barcode: '',
    imageUrl: '',
    active: true
  })

  const categorias = ['Finalizador', 'Higiene', 'Barba', 'Coloração', 'Tratamento', 'Outros']

  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchProdutos()
    }
  }, [userProfile])

  const fetchProdutos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('name')

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (produto = null) => {
    if (produto) {
      setEditingProduto(produto)
      setFormData({
        name: produto.name,
        brand: produto.brand || '',
        description: produto.description || '',
        price: produto.sale_price,
        cost: produto.cost_price || 0,
        stock: produto.current_stock || 0,
        minStock: produto.min_stock_alert || 0,
        category: produto.category || '',
        barcode: produto.barcode || '',
        imageUrl: produto.image_url || '',
        active: produto.is_active
      })
    } else {
      setEditingProduto(null)
      setFormData({
        name: '',
        brand: '',
        description: '',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0,
        category: '',
        barcode: '',
        imageUrl: '',
        active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduto(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const produtoData = {
        organization_id: userProfile.organization_id,
        name: formData.name,
        brand: formData.brand || null,
        description: formData.description || null,
        sale_price: formData.price,
        cost_price: formData.cost || null,
        current_stock: formData.stock || 0,
        min_stock_alert: formData.minStock || 0,
        category: formData.category || null,
        barcode: formData.barcode || null,
        image_url: formData.imageUrl || null,
        is_active: formData.active,
        track_inventory: true
      }

      if (editingProduto) {
        const { error } = await supabase
          .from('products')
          .update(produtoData)
          .eq('id', editingProduto.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([produtoData])

        if (error) throw error
      }

      await fetchProdutos()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchProdutos()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto: ' + error.message)
    }
  }

  const stats = [
    {
      label: 'Total de Produtos',
      value: produtos.length,
      icon: '📦',
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Produtos Ativos',
      value: produtos.filter(p => p.is_active).length,
      icon: '✅',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Estoque Baixo',
      value: produtos.filter(p => p.current_stock <= p.min_stock_alert).length,
      icon: '⚠️',
      color: 'from-red-500 to-red-600'
    },
    {
      label: 'Valor em Estoque',
      value: `R$ ${produtos.reduce((sum, p) => sum + (p.sale_price * p.current_stock), 0).toFixed(2)}`,
      icon: '💰',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Produtos</h1>
        <p className="text-gray-400">Gerencie o estoque de produtos</p>
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
          <h2 className="text-xl font-bold text-white">Lista de Produtos</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-medium"
          >
            <span className="text-xl">➕</span>
            Novo Produto
          </button>
        </div>
      </div>

      {/* Produtos Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Produto</th>
              <th className="text-left p-4 text-gray-400 font-medium">Categoria</th>
              <th className="text-left p-4 text-gray-400 font-medium">Preço</th>
              <th className="text-left p-4 text-gray-400 font-medium">Custo</th>
              <th className="text-left p-4 text-gray-400 font-medium">Estoque</th>
              <th className="text-left p-4 text-gray-400 font-medium">Status</th>
              <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {produtos.map(produto => (
              <tr key={produto.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {produto.image_url ? (
                      <img
                        src={produto.image_url}
                        alt={produto.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                        📦
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{produto.name}</p>
                      <p className="text-gray-500 text-sm">{produto.brand || 'Sem marca'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-300">{produto.category || 'N/A'}</span>
                </td>
                <td className="p-4">
                  <span className="text-green-400 font-medium">R$ {produto.sale_price.toFixed(2)}</span>
                </td>
                <td className="p-4">
                  <span className="text-gray-400">R$ {(produto.cost_price || 0).toFixed(2)}</span>
                </td>
                <td className="p-4">
                  <div>
                    <span className={`font-medium ${
                      produto.current_stock <= produto.min_stock_alert
                        ? 'text-red-400'
                        : 'text-white'
                    }`}>
                      {produto.current_stock}
                    </span>
                    {produto.current_stock <= produto.min_stock_alert && (
                      <span className="ml-2 text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">Baixo</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    produto.is_active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  }`}>
                    {produto.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(produto)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(produto.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {produtos.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhum produto cadastrado</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Imagem */}
              <ImageUpload
                currentImageUrl={formData.imageUrl}
                onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                bucket="images"
                folder="products"
                label="Imagem do Produto"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Produto *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Selecione</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Venda *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estoque Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none h-20 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-500"
                  />
                  <span className="text-gray-300 font-medium">Produto ativo</span>
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
                  {editingProduto ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
