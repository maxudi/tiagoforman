import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agendamentos from './pages/Agendamentos'
import Atendentes from './pages/Atendentes'
import Horarios from './pages/Horarios'
import Servicos from './pages/Servicos'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import Funcionarios from './pages/Funcionarios'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<Login />} />
      
      {/* Protected Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="agendamentos" element={<Agendamentos />} />
                <Route path="atendentes" element={<Atendentes />} />
                <Route path="horarios" element={<Horarios />} />
                <Route path="servicos" element={<Servicos />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="funcionarios" element={<Funcionarios />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Redirect /admin to /admin/dashboard */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default App
