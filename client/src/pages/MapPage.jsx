import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export default function MapPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const lat = parseFloat(params.get('lat'))
  const lon = parseFloat(params.get('lon'))
  const label = params.get('label') || 'Rescue Location'

  const mapsHref = useMemo(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    }
    return 'https://www.google.com/maps'
  }, [lat, lon])

  const embedSrc = useMemo(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `https://www.google.com/maps?q=${lat},${lon}&z=16&output=embed`
    }
    return `https://www.google.com/maps?output=embed`
  }, [lat, lon])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Live Map</h1>
          <a
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="mb-3 text-sm text-gray-700">
            {Number.isFinite(lat) && Number.isFinite(lon) ? (
              <span>
                {label}: {lat.toFixed(6)}, {lon.toFixed(6)}
              </span>
            ) : (
              <span>Coordinates missing</span>
            )}
          </div>
          <div className="aspect-video w-full">
            <iframe
              title="Google Map"
              src={embedSrc}
              className="w-full h-full rounded-lg border"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


