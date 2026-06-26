import { getIdToken, auth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(method, path, body = null) {
  const token = await getIdToken()
  const user  = auth.currentUser

  const headers = { 'Content-Type': 'application/json' }

  // Send Firebase token for real verification
  if (token) {
    headers['x-firebase-token'] = token
  }

  // Always send x-user-id as fallback (backend uses it in demo mode)
  if (user?.uid) {
    headers['x-user-id'] = user.uid
  } else {
    headers['x-user-id'] = 'demo_user'
  }

  const googleToken = localStorage.getItem('dz_google_access_token')
  if (googleToken) {
    headers['x-google-token'] = googleToken
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const taskApi = {
  list:       ()           => request('GET',    '/tasks/'),
  create:     (payload)    => request('POST',   '/tasks/', payload),
  update:     (id, payload)=> request('PATCH',  `/tasks/${id}`, payload),
  delete:     (id)         => request('DELETE', `/tasks/${id}`),
  complete:   (id)         => request('POST',   `/tasks/${id}/complete`),
  reschedule: (id)         => request('POST',   `/tasks/${id}/reschedule`),
}

export const agentApi = {
  chat:         (message, tasks = []) => request('POST', '/agent/chat', { message, tasks, user_id: 'from_token' }),
  sessionStart: ()                    => request('POST', '/agent/session-start'),
  debrief:      ()                    => request('POST', '/agent/debrief'),
}