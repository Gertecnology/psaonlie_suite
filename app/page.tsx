"use client"

import React, { useState, useEffect } from 'react'
import Image from "next/image" // Restaurar Image si se usa en el diseño original
import { SearchForm } from "@/components/search-form"
import { SearchResultsPage } from "@/components/search-results-page"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SearchTips } from "@/components/search-tips"
import type { Parada, Trip } from "@/lib/api"
import { searchParadas, getTripsFromApi } from "@/lib/api"
import { format } from "date-fns"
import { es } from 'date-fns/locale'

interface SearchSummary {
  origin: string
  destination: string
  date: string
}

export default function Home() {
  const [showResults, setShowResults] = useState<boolean>(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchErrorMsg, setSearchErrorMsg] = useState<string | null>(null)

  const handleGoToHomeSearch = () => {
    setShowResults(false)
    setTrips([])
    setSearchSummary(null)
    window.scrollTo(0, 0)
  }

  const اصلیHandleSearchSubmit = async (origin: Parada | null, destination: Parada | null, dateString: string) => {
    if (!origin || !destination || !dateString) {
      setSearchErrorMsg("Por favor, complete todos los campos de búsqueda.")
      setTrips([])
      return
    }

    setIsLoading(true)
    setSearchErrorMsg(null)
    setTrips([])
    setSearchSummary({ origin: origin.descripcion, destination: destination.descripcion, date: dateString })

    try {
      const [originParadasFull, destinationParadasFull] = await Promise.all([
        searchParadas(origin.descripcion),
        searchParadas(destination.descripcion)
      ])

      if (!originParadasFull.length) {
        setSearchErrorMsg(`No se encontraron paradas homologadas para el origen: ${origin.descripcion}`)
        setIsLoading(false)
        return
      }
      if (!destinationParadasFull.length) {
        setSearchErrorMsg(`No se encontraron paradas homologadas para el destino: ${destination.descripcion}`)
        setIsLoading(false)
        return
      }

      const allOriginIds = originParadasFull.map(p => p.idExterno)
      const allDestinationIds = destinationParadasFull.map(p => p.idExterno)

      if (!allOriginIds.length || !allDestinationIds.length) {
        setSearchErrorMsg("No se pudieron obtener los IDs externos para la búsqueda.")
        setIsLoading(false)
        return
      }

      console.log("Enviando a getTripsFromApi:", { origin: allOriginIds, destino: allDestinationIds, fecha: dateString })
      const fetchedTrips = await getTripsFromApi(allOriginIds, allDestinationIds, dateString)

      if (fetchedTrips.length === 0) {
        setSearchErrorMsg("No se encontraron viajes para la búsqueda realizada.")
      }
      setTrips(fetchedTrips)

    } catch (error) {
      console.error("Error en handleSearchSubmit:", error)
      setSearchErrorMsg(error instanceof Error ? error.message : "Ocurrió un error al buscar viajes.")
      setTrips([])
    } finally {
      setIsLoading(false)
      setShowResults(true)
      window.scrollTo(0, 0)
    }
  }

  const handleUpdateSearch = async (newOriginText: string, newDestinationText: string, newDateObject: Date) => {
    if (!newOriginText || !newDestinationText || !newDateObject) {
      setSearchErrorMsg("Por favor, complete todos los campos para actualizar la búsqueda.")
      return
    }
    setIsLoading(true)
    setSearchErrorMsg(null)
    
    const formattedDate = format(newDateObject, "yyyy-MM-dd")
    setSearchSummary({ origin: newOriginText, destination: newDestinationText, date: formattedDate })

    try {
      const [originParadasFull, destinationParadasFull] = await Promise.all([
        searchParadas(newOriginText),
        searchParadas(newDestinationText)
      ])

      if (!originParadasFull.length) {
        setSearchErrorMsg(`No se encontraron paradas homologadas para el origen: ${newOriginText}`)
        setTrips([])
        setIsLoading(false)
        return
      }
      if (!destinationParadasFull.length) {
        setSearchErrorMsg(`No se encontraron paradas homologadas para el destino: ${newDestinationText}`)
        setTrips([])
        setIsLoading(false)
        return
      }

      const allOriginIds = originParadasFull.map(p => p.idExterno)
      const allDestinationIds = destinationParadasFull.map(p => p.idExterno)

      if (!allOriginIds.length || !allDestinationIds.length) {
        setSearchErrorMsg("No se pudieron obtener los IDs externos para la búsqueda.")
        setTrips([])
        setIsLoading(false)
        return
      }
      
      console.log("Actualizando búsqueda con:", { origin: allOriginIds, destino: allDestinationIds, fecha: formattedDate })
      const fetchedTrips = await getTripsFromApi(allOriginIds, allDestinationIds, formattedDate) 
      
      if (fetchedTrips.length === 0) {
        setSearchErrorMsg("No se encontraron viajes para los nuevos criterios de búsqueda.")
      }
      setTrips(fetchedTrips)

    } catch (error) {
      console.error("Error en handleUpdateSearch:", error)
      setSearchErrorMsg(error instanceof Error ? error.message : "Ocurrió un error al actualizar la búsqueda.")
      setTrips([])
    } finally {
      setIsLoading(false)
      // setShowResults se mantiene true ya que estamos en la página de resultados
    }
  }

  const handleNewSearch = () => {
    setShowResults(false)
    setTrips([])
    setSearchSummary(null)
    setSearchErrorMsg(null)
    // Opcionalmente, resetear también los inputs del SearchForm si fuera necesario,
    // pero SearchForm maneja su propio estado interno para los inputs.
  }

  const handleSearchStart = () => {
    console.log("Search started from main form")
  }

  const handleSearchError = (error: string) => {
    console.error("Local SearchForm error:", error)
    setSearchErrorMsg(error)
    setIsLoading(false)
  }

  // Efecto para parsear la fecha del searchSummary a Date si es necesario en otros componentes
  // o para la consistencia interna de currentDate.
  const currentDateAsDateObject = searchSummary?.date ? new Date(searchSummary.date + "T00:00:00") : new Date()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl">
              <p className="text-lg font-semibold">Buscando viajes...</p>
            </div>
          </div>
        )}
        {showResults && searchSummary ? (
          <SearchResultsPage
            searchSummary={searchSummary}
            trips={trips}
            isLoading={isLoading}
            onUpdateSearch={handleUpdateSearch}
            onNewSearch={handleNewSearch}
            searchErrorMsg={searchErrorMsg}
            currentDate={currentDateAsDateObject}
            onDateChange={(directionOrDate: 'prev' | 'next' | Date) => {
              if (!searchSummary) return
              let newDateToSearch: Date
              const currentSummaryDate = new Date(searchSummary.date + "T00:00:00") // Asegurar parseo local

              if (typeof directionOrDate === 'string') {
                newDateToSearch = new Date(currentSummaryDate)
                if (directionOrDate === 'prev') {
                  newDateToSearch.setDate(currentSummaryDate.getDate() - 1)
                } else {
                  newDateToSearch.setDate(currentSummaryDate.getDate() + 1)
                }
              } else {
                newDateToSearch = directionOrDate
              }
              // Llamar a handleUpdateSearch con el texto actual y la nueva fecha (objeto Date)
              handleUpdateSearch(searchSummary.origin, searchSummary.destination, newDateToSearch)
            }}
          />
        ) : (
          <section className="relative">
            <div className="bg-gradient-to-b from-white to-gray-50 py-12">
              <div className="container mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-4">
                  Compra tu pasaje de bus en minutos.
                </h1>
                <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                  Encuentra y reserva los mejores pasajes de bus con las empresas más confiables del país
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-b from-gray-50 to-white pb-8">
              <div className="container mx-auto px-4">
                <SearchForm
                  onSearchSubmit={اصلیHandleSearchSubmit}
                  initialOrigin={searchSummary?.origin}
                  initialDestination={searchSummary?.destination}
                  initialDate={searchSummary?.date ? new Date(searchSummary.date + "T00:00:00") : undefined}
                />
              </div>
            </div>

            {!showResults && (
              <div className="h-96 md:h-[500px] relative">
                <Image
                  src="/placeholder.svg?height=500&width=1920"
                  alt="Pareja comprando pasajes online"
                  fill
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}
          </section>
        )}

        {!showResults && <SearchTips />}
      </main>
      <Footer />
    </div>
  )
}

// Helper function para agrupar paradas por empresaId
function groupParadasByEmpresaId(paradas: Parada[]): Map<string, Parada[]> {
  const grouped = new Map<string, Parada[]>()
  paradas.forEach(parada => {
    if (typeof parada.empresaId === 'string') { // Asegurarse que empresaId es string y no undefined/null
      const list = grouped.get(parada.empresaId) || []
      list.push(parada)
      grouped.set(parada.empresaId, list)
    }
  })
  return grouped
}
