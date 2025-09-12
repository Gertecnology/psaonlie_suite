const API_URL = import.meta.env.VITE_API_URL

export interface InvoiceResponse {
  success: boolean
  data: Blob
  filename: string
}

export async function downloadInvoice(numeroTransaccion: string): Promise<InvoiceResponse> {
  try {
    const response = await fetch(`${API_URL}/api/ventas/${numeroTransaccion}/factura`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Venta no encontrada')
      }
      throw new Error('Error al generar la factura')
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'factura.pdf'
      : 'factura.pdf'

    return {
      success: true,
      data: blob,
      filename,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error downloading invoice:', error)
    throw error
  }
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
