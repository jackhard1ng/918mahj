import { useState, useEffect, useMemo } from 'react'
import { useGoogleSheet } from './useGoogleSheet'
import { SHEET_URLS } from '../config'
import { demoEvents, demoShop, demoTestimonials } from '../utils/demoData'
import { isFirebaseReady, subscribeToCollection, subscribeToGallery } from '../services/db'

function parseEventDate(dateStr) {
  if (!dateStr) return null
  const [month, day, year] = dateStr.split('/')
  return new Date(year, month - 1, day)
}

// ─── Firebase real-time hook ───
function useFirebaseCollection(collectionName) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseReady()) { setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToCollection(collectionName, (items) => {
      setData(items.length > 0 ? items : null)
      setLoading(false)
    })
    return unsub
  }, [collectionName])

  return { data, loading }
}

export function useEvents() {
  const { data: firebaseData, loading: fbLoading } = useFirebaseCollection('events')
  const { data: sheetData, loading: sheetLoading, error: sheetError } = useGoogleSheet(SHEET_URLS.events)
  const useDemo = !isFirebaseReady() && (!SHEET_URLS.events || (sheetError && !sheetLoading))

  // Priority: Firebase > Sheet > Demo
  const raw = firebaseData || (useDemo ? demoEvents : sheetData)
  const loading = isFirebaseReady() ? fbLoading : (SHEET_URLS.events ? sheetLoading : false)

  const events = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return raw
      .filter((e) => {
        if (e['Event Type'] === 'Private') return false
        const d = parseEventDate(e['Date'])
        return d && d >= today
      })
      .sort((a, b) => parseEventDate(a['Date']) - parseEventDate(b['Date']))
  }, [raw])

  return { events, allEvents: raw, loading, error: useDemo ? null : sheetError }
}

export function useShop() {
  const { data: firebaseData, loading: fbLoading } = useFirebaseCollection('shop')
  const { data: sheetData, loading: sheetLoading, error: sheetError } = useGoogleSheet(SHEET_URLS.shop)
  const useDemo = !isFirebaseReady() && (!SHEET_URLS.shop || (sheetError && !sheetLoading))

  const products = firebaseData || (useDemo ? demoShop : sheetData)
  const loading = isFirebaseReady() ? fbLoading : (SHEET_URLS.shop ? sheetLoading : false)

  return { products, loading, error: useDemo ? null : sheetError }
}

export function useTestimonials() {
  const { data: firebaseData, loading: fbLoading } = useFirebaseCollection('testimonials')
  const { data: sheetData, loading: sheetLoading, error: sheetError } = useGoogleSheet(SHEET_URLS.testimonials)
  const useDemo = !isFirebaseReady() && (!SHEET_URLS.testimonials || (sheetError && !sheetLoading))

  const testimonials = firebaseData || (useDemo ? demoTestimonials : sheetData)
  const loading = isFirebaseReady() ? fbLoading : (SHEET_URLS.testimonials ? sheetLoading : false)

  return { testimonials, loading, error: useDemo ? null : sheetError }
}

export function useGallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseReady()) { setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToGallery((items) => {
      // Sort newest first
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      setPhotos(items)
      setLoading(false)
    })
    return unsub
  }, [])

  return { photos, loading }
}
