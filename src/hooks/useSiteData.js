import { useMemo } from 'react'
import { useGoogleSheet } from './useGoogleSheet'
import { SHEET_URLS } from '../config'
import { demoEvents, demoShop, demoTestimonials } from '../utils/demoData'

function parseEventDate(dateStr) {
  if (!dateStr) return null
  const [month, day, year] = dateStr.split('/')
  return new Date(year, month - 1, day)
}

export function useEvents() {
  const { data, loading, error } = useGoogleSheet(SHEET_URLS.events)
  const useDemo = !SHEET_URLS.events || (error && !loading)
  const raw = useDemo ? demoEvents : data

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

  return { events, allEvents: raw, loading: SHEET_URLS.events ? loading : false, error: useDemo ? null : error }
}

export function useShop() {
  const { data, loading, error } = useGoogleSheet(SHEET_URLS.shop)
  const useDemo = !SHEET_URLS.shop || (error && !loading)
  const products = useDemo ? demoShop : data
  return { products, loading: SHEET_URLS.shop ? loading : false, error: useDemo ? null : error }
}

export function useTestimonials() {
  const { data, loading, error } = useGoogleSheet(SHEET_URLS.testimonials)
  const useDemo = !SHEET_URLS.testimonials || (error && !loading)
  const testimonials = useDemo ? demoTestimonials : data
  return { testimonials, loading: SHEET_URLS.testimonials ? loading : false, error: useDemo ? null : error }
}
