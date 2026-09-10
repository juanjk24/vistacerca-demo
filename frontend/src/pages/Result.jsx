import { Link, Navigate, useNavigate } from 'react-router-dom'
import { DISCLAIMER, loadResult, RESULT_INFO } from '../api.js'

export default function Result() {
  const navigate = useNavigate()
  const stored = loadResult()
  if (!stored?.assessment?.result) return <Navigate to="/evaluacion" replace />

  const info = RESULT_INFO[stored.assessment.result]

  return (
    <div className="card center-col">
      <h2 className="page-title">Ruta orientativa</h2>
      <div className={`badge ${info.color}`}>
        {info.icon} {info.label}
      </div>
      <p className="lead">{info.message}</p>
      <p className="muted small">
        Evaluación #{stored.assessment.id} · {new Date(stored.assessment.created_at).toLocaleString()}
      </p>
      <div className="row">
        <button type="button" className="btn primary" onClick={() => navigate('/aliados')}>
          Ver aliados
        </button>
        <Link to="/evaluacion" className="btn ghost">
          Repetir evaluación
        </Link>
      </div>
      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  )
}