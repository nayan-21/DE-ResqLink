import { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('user') // 'user' | 'rescue_team'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/api/users/login' : '/api/users/register'
      const payload = mode === 'login' 
        ? { email, password }
        : { email, password, userType }
      
      console.log('Sending request to:', endpoint, 'with payload:', payload)
      
      const { data } = await api.post(endpoint, payload)
      console.log('Response received:', data)
      
      const token = data?.token
      if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('email', data?.user?.email || email)
        localStorage.setItem('userType', data?.user?.userType || userType)
        
        console.log('Stored in localStorage:', {
          token: !!token,
          email: data?.user?.email || email,
          userType: data?.user?.userType || userType
        })
        
        // Redirect based on user type
        if (data?.user?.userType === 'rescue_team') {
          console.log('Redirecting to dashboard')
          navigate('/dashboard')
        } else {
          console.log('Redirecting to home')
          navigate('/')
        }
      }
    } catch (err) {
      console.error('Login/Register error:', err)
      const msg = err?.response?.data?.message || 'Request failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">
          {mode === 'login' ? 'Login' : 'Create account'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                required
              >
                <option value="user">User</option>
                <option value="rescue_team">Rescue Team</option>
              </select>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <button className="mt-4 text-sm text-blue-700" onClick={toggleMode}>
          {mode === 'login' ? "Don't have an account? Register" : 'Have an account? Login'}
        </button>
      </div>
    </div>
  )
}
