import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function HomePage() {
  // Form state for all new fields
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [disasterType, setDisasterType] = useState([])
  const [manualLocation, setManualLocation] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  
  // UI state
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

  // Handle disaster type checkbox changes
  const handleDisasterTypeChange = (type) => {
    setDisasterType(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Client-side validation
  const validateForm = () => {
    if (!peopleCount) {
      setError('Please select the number of people affected')
      return false
    }
    if (disasterType.length === 0) {
      setError('Please select at least one type of disaster')
      return false
    }
    return true
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

      // Client-side validation
      if (!validateForm()) {
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

      // Prepare the complete SOS data
      const sosData = {
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        peopleCount,
        disasterType: disasterType.join(', '),
        manualLocation: manualLocation.trim() || undefined,
        extraInfo: extraInfo.trim() || undefined,
        latitude,
        longitude,
        userEmail,
      }

      console.log('Sending SOS with data:', sosData)

      const { data } = await api.post('/api/sos', sosData)

      console.log('SOS response:', data)
      setSuccess('SOS sent successfully!')
      
      // Reset form
      setName('')
      setContact('')
      setPeopleCount('')
      setDisasterType([])
      setManualLocation('')
      setExtraInfo('')
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Send SOS Request</h1>
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
      
      <form onSubmit={handleSend} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact No. (Optional)
              </label>
              <input
                type="text"
                id="contact"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Phone number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Emergency Details Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Emergency Details</h2>
          
          {/* Number of People - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of People Affected <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['1 - 5', '5 - 15', '15+'].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="peopleCount"
                    value={option}
                    checked={peopleCount === option}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type of Disaster - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Disaster <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Earthquake', 'Landslide', 'Flood', 'Other'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={disasterType.includes(type)}
                    onChange={() => handleDisasterTypeChange(type)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h2>
          
          <div>
            <label htmlFor="manualLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Manual Location Info (Optional)
            </label>
            <textarea
              id="manualLocation"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Provide additional location details, landmarks, or directions"
              rows="3"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="extraInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Extra Information (Optional)
            </label>
            <textarea
              id="extraInfo"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Describe the situation, injuries, immediate needs, or any other relevant information"
              rows="4"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
            />
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          disabled={loading}
        >
          {loading ? 'Sending SOS Request...' : 'Send SOS Request'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your current location will be automatically captured when you submit this form.
        </p>
      </form>
    </div>
  )
}
