import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { statusClass } from './Appointments.jsx'

const ACTIONS = [
  { status: 'CONFIRMED', label: 'Confirmar', kind: 'primary' },
  { status: 'ATTENDED', label: 'Atendido', kind: 'success' },
  { status: 'RESCHEDULED', label: 'Reprogramar', kind: 'warn' },
  { status: 'NO_SHOW', label: 'No asistió', kind: 'danger' },
]

const FRIENDLY = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ATTENDED: 'Atendida',
  RESCHEDULED: 'Reprogramada',
  NO_SHOW: 'No asistió',
}

export default function PartnerPanel() {
  const [appointments, setAppointments] = useState([])
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api
      .listAppointments()
      .then(setAppointments)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(load, [load])

  async function changeStatus(id, status) {
    setUpdating(`${id}:${status}`)
    try {
      await api.updateAppointmentStatus(id, status)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="card center-col">
      <h2 className="page-title">Panel del aliado</h2>
      <p className="muted">Actualiza el estado de las citas. Cada cambio publica un evento.</p>
      {error && <p className="error">{error}</p>}
      {appointments.length === 0 && <p className="muted">No hay citas registradas.</p>}
      <div className="list wide">
        {appointments.map((a) => (
          <div key={a.id} className="list-row">
            <div>
              <strong>
                {a.user_name} → {a.partner_name} · {a.date}
              </strong>
              <p className="muted small">Cita #{a.id}</p>
            </div>
            <div className="row">
              <span className={`badge mini ${statusClass(a.status)}`}>{FRIENDLY[a.status]}</span>
              <div className="row tight">
                {ACTIONS.map(({ status, label, kind }) => (
                  <button
                    key={status}
                    type="button"
                    className={`btn mini ${kind}`}
                    disabled={updating === `${a.id}:${status}` || a.status === status}
                    onClick={() => changeStatus(a.id, status)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}