import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function HomePage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const userType = localStorage.getItem('userType')
  const userEmail = localStorage.getItem('email')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!userEmail) {
        setError('Missing user email. Please login again.')
        setLoading(false)
        return
      }

      // Get current position
      const position = await new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation not supported'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const latitude = Number(position.coords.latitude)
      const longitude = Number(position.coords.longitude)

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates received')
      }

      console.log('Sending SOS with data:', { message, latitude, longitude, userEmail })

      const { data } = await api.post('/api/sos', {
        message: message || '',
        latitude,
        longitude,
        userEmail,
      })

      console.log('SOS response:', data)
      setSuccess('SOS sent successfully!')
      setMessage('')
    } catch (err) {
      console.error('SOS error:', err)
      let msg = 'Failed to send SOS'
      
      if (err.code === 1) {
        msg = 'Location access denied. Please allow location access.'
      } else if (err.code === 2) {
        msg = 'Location unavailable. Please try again.'
      } else if (err.code === 3) {
        msg = 'Location request timed out. Please try again.'
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      } else if (err.message) {
        msg = err.message
      }
      
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Send SOS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {userType === 'rescue_team' ? 'Rescue Team' : 'User'}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSend} className="space-y-4">
        <textarea
          className="w-full border rounded p-3 min-h-32"
          placeholder="Describe your situation (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Sending…' : 'Send SOS'}
        </button>
      </form>
    </div>
  )
}
