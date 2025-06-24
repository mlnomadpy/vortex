import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import type { CSVRow } from '@/types'

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
        } else {
          resolve(results.data as CSVRow[])
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      }
    })
  })
}

export function exportToCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, filename)
}

export function validateDataPoint(row: CSVRow, index: number) {
  const x = parseFloat(row.x as string)
  const y = parseFloat(row.y as string)
  const label = parseFloat(row.label as string)
  
  if (isNaN(x) || isNaN(y) || isNaN(label)) {
    throw new Error(`Invalid data format at row ${index + 1}. Expected format: x,y,label`)
  }
  
  return { x, y, label }
}
