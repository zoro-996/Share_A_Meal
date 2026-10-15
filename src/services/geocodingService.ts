import type { ReverseGeocodeResult } from '../types/registration'

export class GeolocationError extends Error {
  code?: number
  constructor(message: string, code?: number) {
    super(message)
    this.name = 'GeolocationError'
    this.code = code
  }
}

/**
 * Request device coordinates via browser Geolocation API
 */
export async function getDeviceCoordinates(): Promise<{ latitude: number; longitude: number }> {
  if (!navigator.geolocation) {
    throw new GeolocationError('Geolocation is not supported by your browser. Please enter your address manually.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new GeolocationError(
                'Location access was denied. Please allow location permissions in your browser or fill in the address manually.',
                error.code
              )
            )
            break
          case error.POSITION_UNAVAILABLE:
            reject(
              new GeolocationError(
                'Device location is currently unavailable. Please check your GPS signal or enter your address manually.',
                error.code
              )
            )
            break
          case error.TIMEOUT:
            reject(
              new GeolocationError(
                'Location request timed out. Please try again or enter your address manually.',
                error.code
              )
            )
            break
          default:
            reject(
              new GeolocationError(
                'An error occurred while retrieving your location. Please enter your address manually.',
                error.code
              )
            )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  })
}

interface NominatimAddress {
  house_number?: string
  building?: string
  road?: string
  pedestrian?: string
  street?: string
  suburb?: string
  neighbourhood?: string
  residential?: string
  subdistrict?: string
  commercial?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  city_district?: string
  county?: string
  state?: string
  state_district?: string
  postcode?: string
  country?: string
  country_code?: string
  amenity?: string
  railway?: string
  bus_stop?: string
  historic?: string
  place_of_worship?: string
  shop?: string
  tourism?: string
}

interface NominatimResponse {
  place_id?: number
  name?: string
  lat?: string
  lon?: string
  display_name?: string
  address?: NominatimAddress
  error?: string
}

/**
 * Reverse-geocode latitude and longitude into structured Indian/international address components.
 * Follows strict mapping rules:
 * - Does not invent missing data.
 * - Does not dump city into Address Line 1.
 * - Extracts landmark only if a genuine POI/amenity exists.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  let responseData: NominatimResponse | null = null

  // 1. Attempt backend proxy endpoint first to respect rate-limiting and User-Agent policies
  try {
    const proxyRes = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`)
    if (proxyRes.ok) {
      responseData = await proxyRes.json()
    }
  } catch {
    // If backend proxy is not reachable, fall through to direct Nominatim call
  }

  // 2. Direct OpenStreetMap Nominatim fallback
  if (!responseData || responseData.error) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      }
      // If running in Node or server environment where User-Agent is customizable
      if (typeof window === 'undefined') {
        headers['User-Agent'] = 'ShareAMealApp/1.0 (contact@shareameal.local)'
      }
      const directRes = await fetch(url, { headers })
      if (!directRes.ok) {
        throw new Error(`Reverse geocoding service returned status ${directRes.status}`)
      }
      responseData = await directRes.json()
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the reverse-geocoding service. Please enter your address manually.'
      )
    }
  }

  if (!responseData || !responseData.address) {
    throw new Error('No address details were found for the selected coordinates. Please enter your address manually.')
  }

  const addr = responseData.address
  const unresolved: string[] = []

  // Mapping Address Line 1: building, amenity, shop, tourism, road, house_number
  const streetName = addr.road || addr.pedestrian || addr.street || ''
  const premisesName =
    addr.building ||
    addr.amenity ||
    addr.shop ||
    addr.tourism ||
    addr.commercial ||
    (responseData.name && responseData.name !== streetName && responseData.name !== addr.city ? responseData.name : '') ||
    ''
  const houseNum = addr.house_number || ''

  let addressLine1 = ''
  if (premisesName && streetName && premisesName !== streetName) {
    addressLine1 = houseNum ? `${houseNum}, ${premisesName}, ${streetName}` : `${premisesName}, ${streetName}`
  } else if (premisesName) {
    addressLine1 = houseNum ? `${houseNum}, ${premisesName}` : premisesName
  } else if (streetName) {
    addressLine1 = houseNum ? `${houseNum}, ${streetName}` : streetName
  } else if (responseData.name && responseData.name !== addr.city && responseData.name !== addr.state) {
    addressLine1 = responseData.name
  } else {
    // If no street/building info exists, do NOT put city here! Leave empty.
    unresolved.push('Address Line 1')
  }

  // Mapping Area / Locality
  const areaLocality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.subdistrict ||
    addr.commercial ||
    ''

  if (!areaLocality) {
    unresolved.push('Area / Locality')
  }

  // Mapping City
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    ''

  if (!city) {
    unresolved.push('City')
  }

  // Mapping State
  const state = addr.state || addr.state_district || ''
  if (!state) {
    unresolved.push('State')
  }

  // Mapping PIN Code (postcode)
  let pincode = ''
  if (addr.postcode) {
    const cleanedPin = addr.postcode.replace(/\D/g, '')
    // Indian PIN codes are 6 digits
    if (cleanedPin.length === 6) {
      pincode = cleanedPin
    } else if (cleanedPin.length >= 4 && cleanedPin.length <= 8) {
      pincode = cleanedPin
    }
  }
  if (!pincode) {
    unresolved.push('PIN Code')
  }

  // Mapping Landmark: only if genuine, recognizable landmark/amenity exists and is distinct
  let landmark = ''
  const potentialLandmark =
    addr.amenity ||
    addr.railway ||
    addr.bus_stop ||
    addr.place_of_worship ||
    addr.historic ||
    addr.tourism ||
    ''

  if (
    potentialLandmark &&
    potentialLandmark.toLowerCase() !== premisesName.toLowerCase() &&
    potentialLandmark.toLowerCase() !== streetName.toLowerCase() &&
    potentialLandmark.toLowerCase() !== areaLocality.toLowerCase()
  ) {
    landmark = `Near ${potentialLandmark}`
  } else {
    unresolved.push('Landmark')
  }

  return {
    addressLine1: addressLine1 || undefined,
    areaLocality: areaLocality || undefined,
    city: city || undefined,
    state: state || undefined,
    pincode: pincode || undefined,
    landmark: landmark || undefined,
    latitude,
    longitude,
    rawDisplayName: responseData.display_name,
    unresolvedFields: unresolved,
  }
}
