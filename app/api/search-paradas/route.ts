import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://srv815070.hstgr.cloud:3001"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const searchTerm = searchParams.get("searchTerm")

  if (!searchTerm) {
    return NextResponse.json({ error: "searchTerm is required" }, { status: 400 })
  }

  try {
  
    const response = await axios.get(`${API_BASE_URL}/api/search-paradas-homologadas?searchTerm=${searchTerm}`)

    console.log("✅ Respuesta de la API:")
 
    console.log("Tipo de data:",  response.data)
  
  console.error(Error)
    

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("❌ Error completo:", error)
    if (axios.isAxiosError(error)) {
      
    }
    return NextResponse.json({ error: "Error al buscar paradas" }, { status: 500 })
  }
}
