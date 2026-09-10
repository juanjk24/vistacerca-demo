const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const GATEWAY = BASE.replace(/\/api$/, '')

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
  return data
}

export const api = {
  createUser: (user) => request('/users', { method: 'POST', body: user }),
  createAssessment: (assessment) => request('/assessments', { method: 'POST', body: assessment }),
  listAssessments: () => request('/assessments'),
  listPartners: () => request('/partners'),
  createAppointment: (appointment) => request('/appointments', { method: 'POST', body: appointment }),
  listAppointments: () => request('/appointments'),
  listMyAppointments: (userId) => request(`/appointments?userId=${userId}`),
  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
  metrics: () => request('/metrics'),
  listAssessmentsStats: () => request('/assessments'),
}

export async function fetchHealth() {
  const res = await fetch(`${GATEWAY}/health`)
  return res.json()
}

export const USER_KEY = 'vistacerca_user'
export const RESULT_KEY = 'vistacerca_result'

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}

export function saveResult(result) {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function loadResult() {
  try {
    return JSON.parse(localStorage.getItem(RESULT_KEY))
  } catch {
    return null
  }
}

export const RESULT_INFO = {
  GREEN: {
    label: 'VERDE',
    color: 'green',
    icon: '🟢',
    message: 'Tu señal orientativa es baja. Mantén hábitos saludables y un seguimiento preventivo.',
  },
  YELLOW: {
    label: 'AMARILLO',
    color: 'yellow',
    icon: '🟡',
    message: 'Señal orientativa moderada. Te recomendamos considerar una valoración profesional.',
  },
  RED: {
    label: 'ROJO',
    color: 'red',
    icon: '🔴',
    message: 'Señal orientativa alta. Te recomendamos buscar valoración profesional con prontitud.',
  },
}

export const DISCLAIMER =
  'Resultado orientativo del prototipo académico. No constituye diagnóstico médico.'