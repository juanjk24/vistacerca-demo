import { useEffect, useState } from 'react'
import { fetchHealth } from '../api.js'

export default function StatusView() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      fetchHealth()
        .then(setHealth)
        .catch((err) => setError(err.message))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const services = health
    ? Object.entries(health).filter(([name]) => name !== 'gateway')
    : []

  return (
    <div className="card center-col">
      <h2 className="page-title">Estado de la arquitectura</h2>
      <p className="muted">
        El gateway verifica el health de cada servicio. Apaga un contenedor y observa cómo cambia.
      </p>
      {error && <p className="error">{error}</p>}
      {health && (
        <div className="grid wide">
          {services.map(([name, status]) => (
            <div key={name} className="card mini">
              <h3 className="mono">{name}</h3>
              <span className={`badge ${status === 'up' ? 'green' : 'red'}`}>
                {status === 'up' ? '● En línea' : '● Caído'}
              </span>
            </div>
          ))}
        </div>
      )}
      {health && (
        <p className="muted small">
          gateway: {health.gateway} · {new Date().toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}