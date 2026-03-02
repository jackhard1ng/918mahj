import Papa from 'papaparse'

export function parseCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })
  return result.data
}
