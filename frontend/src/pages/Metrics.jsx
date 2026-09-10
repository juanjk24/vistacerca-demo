import { useEffect, useState } from 'react'
import { api } from '../api.js'

function prettyKey(key) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Metrics() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      api
        .metrics()
        .then((data) => setRows(data.metrics ?? []))
        .catch((err) => setError(err.message))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const totalAssessments = rows
    .filter((r) => r.key.startsWith('assessments.'))
    .reduce((acc, r) => acc + Number(r.value), 0)
  const totalAppointments = rows
    .filter((r) => r.key.startsWith('appointments.'))
    .reduce((acc, r) => acc + Number(r.value), 0)

  return (
    <div className="card center-col">
      <h2 className="page-title">VistaCerca Metrics</h2>
      <p className="muted">
        Contadores agregados en tiempo real por el <code>analytics-worker</code> (se actualizan cada 3s).
      </p>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        <div className="stat">
          <strong>{totalAssessments}</strong>
          <span>Evaluaciones</span>
        </div>
        <div className="stat">
          <strong>{totalAppointments}</strong>
          <span>Citas</span>
        </div>
      </div>
      <div className="list wide">
        {rows.map((r) => (
          <div key={r.key} className="list-row">
            <span>{prettyKey(r.key)}</span>
            <strong>{Number(r.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}