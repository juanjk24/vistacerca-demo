import { useNavigate } from 'react-router-dom'
import { api, clearUser, loadUser, saveUser } from '../api.js'

export default function Home() {
  const navigate = useNavigate()
  const user = loadUser()

  async function onSubmit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name'),
      age: Number(form.get('age')) || null,
      city: form.get('city'),
    }
    try {
      if (user && user.name === data.name) {
        saveUser({ ...user, age: data.age, city: data.city })
      } else {
        const created = await api.createUser(data)
        saveUser(created)
      }
      navigate('/evaluacion')
    } catch (err) {
      alert(`No se pudo crear el usuario: ${err.message}`)
    }
  }

  return (
    <div className="card center-col">
      <h1 className="page-title">Tu ruta visual</h1>
      <p className="lead">
        Captura cómo te sientes, recibe una clasificación orientativa y conéctate con aliados
        cercanos para agendar una valoración.
      </p>

      {user && (
        <div className="chip success">Usuario activo: {user.name} (id {user.id})</div>
      )}

      <form className="form" onSubmit={onSubmit}>
        <label>
          Nombre
          <input name="name" required defaultValue={user?.name ?? ''} placeholder="Ej: Juan Cuellar" />
        </label>
        <label>
          Edad
          <input name="age" type="number" min="1" max="120" defaultValue={user?.age ?? ''} />
        </label>
        <label>
          Ciudad
          <input name="city" defaultValue={user?.city ?? 'Mocoa'} />
        </label>
        <button type="submit" className="btn primary">
          Comenzar evaluación
        </button>
      </form>

      {user && (
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            clearUser()
            window.location.reload()
          }}
        >
          Cambiar de usuario
        </button>
      )}
    </div>
  )
}