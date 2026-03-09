import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Planner from './pages/Planner.jsx'
import PlansList from './pages/PlansList.jsx'
import PlanDetail from './pages/PlanDetail.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>GUI Agent</h1>
          <p>Next action planner</p>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Planner
          </NavLink>
          <NavLink to="/plans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Plans
          </NavLink>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Planner />} />
          <Route path="/plans" element={<PlansList />} />
          <Route path="/plans/:id" element={<PlanDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
