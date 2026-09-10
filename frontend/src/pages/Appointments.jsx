import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, loadUser } from '../api.js'

const STATUS_LABEL = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ATTENDED: 'Atendida',
  RESCHEDULED: 'Reprogramada',
  NO_SHOW: 'No asistió',
}

export const statusClass = (status) => (STATUS_LABEL[status] ? status.toLowerCase() : 'pending')
export const STATUS_LABEL_MAP = STATUS_LABEL

export default function Appointments() {
  const user = loadUser()
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api
      .listMyAppointments(user.id)
      .then(setAppointments)
      .catch((err) => setError(err.message))
  }, [user])

  return (
    <div className="card center-col">
      <h2 className="page-title">Mis citas</h2>
      {!user && <Link to="/">Regístrate para ver tus citas</Link>}
      {error && <p className="error">{error}</p>}
      {appointments.length === 0 && <p className="muted">Aún no tienes citas.</p>}
      <div className="list wide">
        {appointments.map((a) => (
          <div key={a.id} className="list-row">
            <div>
              <strong>
                {a.partner_name} · {a.date}
              </strong>
              <p className="muted small">Cita #{a.id}</p>
            </div>
            <span className={`badge mini ${statusClass(a.status)}`}>{STATUS_LABEL_MAP[a.status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}