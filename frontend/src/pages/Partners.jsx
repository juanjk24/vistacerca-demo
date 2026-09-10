import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, loadResult, loadUser } from '../api.js'

export default function Partners() {
  const navigate = useNavigate()
  const user = loadUser()
  const result = loadResult()
  const [partners, setPartners] = useState([])
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .listPartners()
      .then(setPartners)
      .catch((err) => setError(err.message))
  }, [])

  async function requestAppointment(partner) {
    if (!user) {
      navigate('/')
      return
    }
    setBooking(partner.id)
    try {
      await api.createAppointment({
        userId: user.id,
        partnerId: partner.id,
        date,
      })
      navigate('/citas')
    } catch (err) {
      alert(`No se pudo crear la cita: ${err.message}`)
      setBooking(null)
    }
  }

  return (
    <div className="card center-col">
      <h2 className="page-title">Aliados disponibles</h2>
      {result?.assessment?.result && (
        <p className="muted">
          En función de tu ruta {result.assessment.result}, estos aliados pueden ayudarte.
        </p>
      )}
      <label className="muted small">
        Fecha sugerida para la cita
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {partners.map((p) => (
          <div key={p.id} className="card mini">
            <h3>{p.name}</h3>
            <p className="muted">
              {p.type} · {p.city}
            </p>
            <button
              type="button"
              className="btn primary small-btn"
              disabled={booking === p.id}
              onClick={() => requestAppointment(p)}
            >
              {booking === p.id ? 'Solicitando…' : 'Solicitar cita'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}