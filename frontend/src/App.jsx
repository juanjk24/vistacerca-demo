import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Evaluation from './pages/Evaluation.jsx'
import Result from './pages/Result.jsx'
import Partners from './pages/Partners.jsx'
import Appointments from './pages/Appointments.jsx'
import PartnerPanel from './pages/PartnerPanel.jsx'
import Metrics from './pages/Metrics.jsx'
import StatusView from './pages/StatusView.jsx'

function Nav() {
  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')
  return (
    <header className="app-header">
      <NavLink to="/" className="brand">
        👁️ VistaCerca
      </NavLink>
      <nav>
        <NavLink to="/" className={linkClass} end>
          Inicio
        </NavLink>
        <NavLink to="/evaluacion" className={linkClass}>
          Evaluación
        </NavLink>
        <NavLink to="/aliados" className={linkClass}>
          Aliados
        </NavLink>
        <NavLink to="/citas" className={linkClass}>
          Mis citas
        </NavLink>
        <NavLink to="/partner" className={linkClass}>
          Panel aliado
        </NavLink>
        <NavLink to="/metricas" className={linkClass}>
          Métricas
        </NavLink>
        <NavLink to="/estado" className={linkClass}>
          Estado
        </NavLink>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/evaluacion" element={<Evaluation />} />
          <Route path="/resultado" element={<Result />} />
          <Route path="/aliados" element={<Partners />} />
          <Route path="/citas" element={<Appointments />} />
          <Route path="/partner" element={<PartnerPanel />} />
          <Route path="/metricas" element={<Metrics />} />
          <Route path="/estado" element={<StatusView />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Prototipo académico de arquitectura distribuida · React + Node.js + PostgreSQL + RabbitMQ
      </footer>
    </>
  )
}