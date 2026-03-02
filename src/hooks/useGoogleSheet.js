import { useState, useEffect } from 'react'
import { parseCSV } from '../utils/parseCSV'

export function useGoogleSheet(url) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data')
        return res.text()
      })
      .then((csv) => {
        if (!cancelled) {
          setData(parseCSV(csv))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}
