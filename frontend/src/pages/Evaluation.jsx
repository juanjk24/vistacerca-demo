import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, loadUser, saveResult } from '../api.js'

const SYMPTOMS = [
  { key: 'blurVision', label: 'Visión borrosa' },
  { key: 'eyeBurning', label: 'Ardor o molestia ocular' },
  { key: 'persistentSymptoms', label: 'Síntomas persistentes' },
  { key: 'highScreenTime', label: 'Uso intensivo de pantallas' },
]

export default function Evaluation() {
  const navigate = useNavigate()
  const user = loadUser()
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!user) {
      navigate('/')
      return
    }
    setLoading(true)
    try {
      const payload = {
        userId: user.id,
        blurVision: Boolean(selected.blurVision),
        eyeBurning: Boolean(selected.eyeBurning),
        persistentSymptoms: Boolean(selected.persistentSymptoms),
        highScreenTime: Boolean(selected.highScreenTime),
      }
      const assessment = await api.createAssessment(payload)
      saveResult({ assessment, userId: user.id })
      navigate('/resultado')
    } catch (err) {
      alert(`No se pudo enviar la evaluación: ${err.message}`)
      setLoading(false)
    }
  }

  function toggle(key) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="card center-col">
      <h2 className="page-title">¿Qué señal visual tienes?</h2>
      <p className="muted">
        {user ? `Evaluación para ${user.name}` : 'Debes registrar un usuario primero.'}
      </p>
      <form className="form" onSubmit={onSubmit}>
        <div className="checkbox-list">
          {SYMPTOMS.map(({ key, label }) => (
            <label key={key} className={`check ${selected[key] ? 'check on' : ''}`}>
              <input type="checkbox" checked={Boolean(selected[key])} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Clasificando…' : 'Continuar'}
        </button>
      </form>
      <p className="muted small">{'Se evaluarán reglas simuladas del prototipo académico.'}</p>
    </div>
  )
}