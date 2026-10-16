import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapPin, Navigation, Search, AlertCircle, Shield } from 'lucide-react'

interface CollectionLocationMapProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number, lng: number) => void
  onAutofillRequest?: () => Promise<void> | void
  showCurrentLocationControl?: boolean
  city?: string
  state?: string
}

// Default center: Central India (New Delhi 28.6139, 77.2090)
const DEFAULT_LAT = 28.6139
const DEFAULT_LNG = 77.2090

export const CollectionLocationMap: React.FC<CollectionLocationMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  onAutofillRequest,
  showCurrentLocationControl = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const onLocationChangeRef = useRef(onLocationChange)
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])


  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const activeLat = latitude ?? DEFAULT_LAT
  const activeLng = longitude ?? DEFAULT_LNG

  // Create crisp SVG DivIcon for the map pin
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="transform: translate(-50%, -100%);">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#C25E00" stroke="#78350F" stroke-width="1.5"/>
            <circle cx="17" cy="16" r="6" fill="#FFF0DB"/>
            <circle cx="17" cy="16" r="3" fill="#C25E00"/>
          </svg>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
  }

  const initialCoordsRef = useRef({
    lat: latitude ?? DEFAULT_LAT,
    lng: longitude ?? DEFAULT_LNG,
    hasCoords: latitude !== null && longitude !== null,
  })

  // Initialize Leaflet map once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return

    const initialLat = initialCoordsRef.current.lat
    const initialLng = initialCoordsRef.current.lng
    const initialZoom = initialCoordsRef.current.hasCoords ? 15 : 12

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([initialLat, initialLng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map)

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onLocationChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
      })

      // Click event on map
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        onLocationChangeRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      if (!initialCoordsRef.current.hasCoords) {
        onLocationChangeRef.current(DEFAULT_LAT, DEFAULT_LNG)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, []) // Empty dependency array to prevent map re-instantiation

  // Sync marker position and center map view when props change
  useEffect(() => {
    if (latitude !== null && longitude !== null && markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng()
      const diffLat = Math.abs(currentPos.lat - latitude)
      const diffLng = Math.abs(currentPos.lng - longitude)

      if (diffLat > 0.00001 || diffLng > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude])
        mapInstanceRef.current.setView([latitude, longitude], Math.max(mapInstanceRef.current.getZoom(), 15), {
          animate: true,
        })
      }
    }
  }, [latitude, longitude])

  // "Use My Current Location" button handler
  const handleUseCurrentLocation = async () => {
    setGeoError(null)

    // If an autofill workflow is provided by parent (e.g. reverse geocoding into address fields), use it
    if (onAutofillRequest) {
      setIsLocating(true)
      try {
        await onAutofillRequest()
      } catch (err) {
        setGeoError(err instanceof Error ? err.message : 'Unable to acquire location.')
      } finally {
        setIsLocating(false)
      }
      return
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please click on the map to set the pin.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const lat = Number(position.coords.latitude.toFixed(6))
        const lng = Number(position.coords.longitude.toFixed(6))
        onLocationChangeRef.current(lat, lng)

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true })
          markerRef.current.setLatLng([lat, lng])
        }
      },
      (err) => {
        setIsLocating(false)
        if (err.code === 1) {
          setGeoError('Location permission denied. You can still set the exact location by tapping/clicking anywhere on the map.')
        } else {
          setGeoError('Unable to retrieve device GPS. Please manually move the pin on the map.')
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Quick geocoding / search using Nominatim (open OpenStreetMap search)
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setGeoError(null)

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await resp.json()
      if (data && data.length > 0) {
        const lat = Number(parseFloat(data[0].lat).toFixed(6))
        const lng = Number(parseFloat(data[0].lon).toFixed(6))
        onLocationChangeRef.current(lat, lng)
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15, { animate: true })
          markerRef.current.setLatLng([lat, lng])
        }
      } else {
        setGeoError('Location not found. Please click directly on the map to place your pin.')
      }
    } catch {
      setGeoError('Search service temporarily unavailable. Please click directly on the map to adjust the pin.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Title & Coordinates Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#29352F] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#C25E00]" />
            Pin Your Collection Location <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-[#6B756F] mt-0.5">
            Click map or drag the pin to mark the exact collection point.
          </p>
        </div>

        {/* Selected Coordinates */}
        <div className="bg-[#FFF0DB] border border-[#FFE0B2] px-2.5 py-1 rounded-lg text-xs font-mono text-[#9A3412] self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
          <span className="font-semibold">Coords:</span>
          <span>{activeLat.toFixed(4)}, {activeLng.toFixed(4)}</span>
        </div>
      </div>

      {/* Map Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input */}
        <form onSubmit={handleSearchLocation} className="flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark or locality..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
            />
            <Search className="w-3.5 h-3.5 text-[#6B756F] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] hover:bg-neutral-100 text-[#29352F] disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Find'}
          </button>
        </form>

        {showCurrentLocationControl && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] hover:bg-[#D8EAFF] transition-colors cursor-pointer shrink-0"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
          </button>
        )}
      </div>

      {/* Geolocation feedback / error */}
      {geoError && (
        <div role="alert" className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-[#E6EAE7] shadow-2xs h-64 sm:h-72 w-full bg-[#FAFAFA]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Privacy note */}
      <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E6EAE7] text-xs text-[#6B756F] flex items-start gap-2">
        <Shield className="w-4 h-4 text-[#1B5E20] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#29352F]">Location Privacy:</strong> Your collection location will be shared only with authorized volunteers when needed to arrange food pickup. It will not be publicly exposed to anonymous website visitors.
        </p>
      </div>
    </div>
  )
}
