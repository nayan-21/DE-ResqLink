import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { io } from 'socket.io-client'

export default function DashboardPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const userType = localStorage.getItem('userType')
  const userEmail = localStorage.getItem('email')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { data } = await api.get('/api/sos')
        if (!active) return
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!active) return
        const msg = err?.response?.data?.message || 'Failed to fetch SOS requests'
        setError(msg)
      }
    }

    load()

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socket = io(baseURL, { transports: ['websocket'] })

    socket.on('connect', () => {
      // connected
    })

    socket.on('newSOSRequest', (payload) => {
      setItems((prev) => [payload, ...prev])
    })

    socket.on('disconnect', () => {
      // disconnected
    })

    return () => {
      active = false
      socket.disconnect()
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Rescue Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Rescue Team - {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>
      
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it._id || `${it.latitude}-${it.longitude}-${it.timestamp}`}
              className="border rounded p-3 bg-white">
            <div className="font-medium">{it.message || '(no message)'}</div>
            <div className="text-sm text-gray-600 mt-1">
              Lat: {it.latitude}, Lng: {it.longitude}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(it.timestamp || it.createdAt).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{it.userEmail}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
