import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { io } from 'socket.io-client'

export default function DashboardPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [addresses, setAddresses] = useState({})
  const navigate = useNavigate()

  const userType = localStorage.getItem('userType')
  const userEmail = localStorage.getItem('email')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Helper function to get disaster type badge color
  const getDisasterTypeColor = (type) => {
    const colors = {
      'Earthquake': 'bg-orange-100 text-orange-800 border-orange-200',
      'Landslide': 'bg-amber-100 text-amber-800 border-amber-200',
      'Flood': 'bg-blue-100 text-blue-800 border-blue-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Helper function to get people count badge color
  const getPeopleCountColor = (count) => {
    if (count === '1 - 5') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (count === '5 - 15') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (count === '15+') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Fetch human-readable address for given coordinates and cache in state
  const fetchAddress = async (requestId, lat, lon) => {
    try {
      if (requestId == null || lat == null || lon == null) return
      const { data } = await api.get('/api/location', { params: { lat, lon } })
      const addressText = data?.address || 'Address unavailable'
      setAddresses((prev) => ({ ...prev, [requestId]: addressText }))
    } catch (e) {
      setAddresses((prev) => ({ ...prev, [requestId]: 'Address unavailable' }))
    }
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { data } = await api.get('/api/sos')
        if (!active) return
        const list = Array.isArray(data) ? data : []
        setItems(list)
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
      const requestId = payload?._id || `${payload?.latitude}-${payload?.longitude}-${payload?.timestamp}`
      if (payload?.latitude != null && payload?.longitude != null) {
        fetchAddress(requestId, payload.latitude, payload.longitude)
      }
    })

    socket.on('disconnect', () => {
      // disconnected
    })

    return () => {
      active = false
      socket.disconnect()
    }
  }, [])

  // Ensure addresses are fetched for all visible items
  useEffect(() => {
    if (!Array.isArray(items)) return
    items.forEach((it) => {
      const requestId = it?._id || `${it?.latitude}-${it?.longitude}-${it?.timestamp}`
      if (requestId && addresses[requestId] == null && it?.latitude != null && it?.longitude != null) {
        fetchAddress(requestId, it.latitude, it.longitude)
      }
    })
  }, [items])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Response Dashboard</h1>
              <p className="text-gray-600">Monitor and respond to emergency SOS requests in real-time</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">Rescue Team</div>
                <div className="font-medium text-gray-900">{userEmail}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.peopleCount === '15+').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {items.length > 0 ? formatTimestamp(items[0].timestamp || items[0].createdAt) : 'No requests'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* SOS Requests Grid */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-8xl mb-6">🚨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Emergency Requests</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No SOS requests have been received yet. The dashboard will automatically update when new emergency requests come in.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {items.map((item, index) => (
              <div
                key={item._id || `${item.latitude}-${item.longitude}-${item.timestamp}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Header with emergency type and people count */}
                <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 py-5 relative">
                  <div className="absolute top-4 right-4">
                    <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-3">
                        Emergency Request
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {item.disasterType && item.disasterType.split(', ').map((type, typeIndex) => (
                          <span
                            key={typeIndex}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDisasterTypeColor(type.trim())}`}
                          >
                            {type.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    {item.peopleCount && (
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getPeopleCountColor(item.peopleCount)}`}>
                        {item.peopleCount} people
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Contact Information */}
                  {(item.name || item.contact) && (
                    <div className="border-b border-gray-100 pb-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        {item.name && (
                          <div className="flex items-center text-sm text-gray-700">
                            <span className="font-semibold w-20 text-gray-600">Name:</span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        )}
                        {item.contact && (
                          <div className="flex items-center text-sm text-gray-700">
                            <span className="font-semibold w-20 text-gray-600">Contact:</span>
                            <span className="font-medium">{item.contact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location Information */}
                  <div className="border-b border-gray-100 pb-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Details
                    </h4>
                    <div className="space-y-3">
                      {/* <div className="flex items-center text-sm text-gray-700">
                        <span className="font-semibold w-20 text-gray-600">Address:</span>
                        <span className="text-gray-700">
                          {(() => {
                            const requestId = item._id || `${item.latitude}-${item.longitude}-${item.timestamp}`
                            const addr = addresses[requestId]
                            return addr ? addr : 'Fetching address...'
                          })()}
                        </span>
                      </div> */}
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="font-semibold w-20 text-gray-600">Coordinates:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
                        </span>
                      </div>
                      {item.manualLocation && (
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold block mb-2 text-gray-600">Additional Details:</span>
                          <span className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg block">{item.manualLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Details */}
                  {item.extraInfo && (
                    <div className="border-b border-gray-100 pb-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Emergency Details
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 px-3 py-2 rounded-lg">{item.extraInfo}</p>
                    </div>
                  )}

                  {/* Footer with timestamp and user */}
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Reported:</span> {formatTimestamp(item.timestamp || item.createdAt)}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">User: {item.userEmail}</div>
                      {item.message && (
                        <div className="text-gray-400 mt-1 italic">"{item.message}"</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm">
                    Accept Request
                  </button>
                  <a
                    className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors duration-200 shadow-sm text-center"
                    href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Map
                  </a>
                  <a
                    className="flex-1 bg-gray-100 text-gray-800 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors duration-200 shadow-sm text-center border"
                    href={`/map?lat=${item.latitude}&lon=${item.longitude}&label=${encodeURIComponent('Rescue Location')}`}
                  >
                    Live Map
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
