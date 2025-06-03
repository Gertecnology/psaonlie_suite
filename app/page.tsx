"use client"

import React, { useState } from 'react'
import Image from "next/image" // Restaurar Image si se usa en el diseño original
import { SearchForm } from "@/components/search-form"
import { SearchResultsPage } from "@/components/search-results-page"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SearchTips } from "@/components/search-tips"
import type { Parada, Trip } from "@/lib/api"
import { searchParadas } from "@/lib/api"
import { format } from "date-fns"

interface SearchParameters {
  origin: Parada
  destination: Parada
  departureDate: Date
}

export default function Home() {
  const [showResults, setShowResults] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<Trip[]>([])
  const [searchParameters, setSearchParameters] = useState<SearchParameters | null>(null)

  const handleGoToHomeSearch = () => {
    setShowResults(false)
    setSearchResults([])
    setSearchParameters(null)
    window.scrollTo(0, 0)
  }

  const اصلیHandleSearchSubmit = (
    results: Trip[],
    origin: Parada,
    destination: Parada,
    departureDate: Date
  ) => {
    setSearchResults(results)
    setSearchParameters({ origin, destination, departureDate })
    setShowResults(true)
    window.scrollTo(0, 0)
  }

  const handleUpdateSearch = async (originText: string, destinationText: string, date: Date) => {
    console.log("Attempting to update search with:", { originText, destinationText, date });

    try {
      const originCandidates = await searchParadas(originText);
      const destinationCandidates = await searchParadas(destinationText);

      if (originCandidates.length === 0) {
        alert(`No se encontró una parada de origen para "${originText}". Por favor, intenta con un nombre más específico o verifica la ortografía.`);
        return;
      }
      if (destinationCandidates.length === 0) {
        alert(`No se encontró una parada de destino para "${destinationText}". Por favor, intenta con un nombre más específico o verifica la ortografía.`);
        return;
      }

      const newOrigin: Parada = originCandidates[0];
      const newDestination: Parada = destinationCandidates[0];

      console.log("Resolved newOrigin:", JSON.stringify(newOrigin, null, 2));
      console.log("Resolved newDestination:", JSON.stringify(newDestination, null, 2));
      if (!newOrigin || typeof newOrigin.empresaNombre === 'undefined') {
        console.error("newOrigin está mal formado o le falta empresaNombre", newOrigin);
        alert("Error interno: Datos de origen incompletos después de la búsqueda de parada.");
        return;
      }
      if (!newDestination || typeof newDestination.empresaNombre === 'undefined') {
        console.error("newDestination está mal formado o le falta empresaNombre", newDestination);
        alert("Error interno: Datos de destino incompletos después de la búsqueda de parada.");
        return;
      }

      console.log("Simulating API call for updated trips with:", { newOrigin, newDestination, date });
      setTimeout(() => {
        console.log("Inside setTimeout - newOrigin:", JSON.stringify(newOrigin, null, 2)); 
        console.log("Inside setTimeout - newDestination:", JSON.stringify(newDestination, null, 2));

        const resultadosSimulados: Trip[] = [
          {
            id: "updated-1",
            empresaNombre: newOrigin.empresaNombre || "Empresa Actualizada A",
            fechaSalida: format(date, "yyyy-MM-dd"),
            horaSalida: "09:00",
            fechaLlegada: format(date, "yyyy-MM-dd"), 
            horaLlegada: "13:00",
            tipoServicio: "Coche Cama Deluxe",
            asientosDisponibles: 10,
            duracionViajeFormato: "4h aprox.",
            precio: 280000,
            moneda: "Gs",
          },
          {
            id: "updated-2",
            empresaNombre: newDestination.empresaNombre || "Empresa Actualizada B",
            fechaSalida: format(date, "yyyy-MM-dd"),
            horaSalida: "15:00",
            fechaLlegada: format(date, "yyyy-MM-dd"),
            horaLlegada: "19:00",
            tipoServicio: "Semi Cama Plus",
            asientosDisponibles: 5,
            duracionViajeFormato: "4h aprox.",
            precio: 380000,
            moneda: "Gs",
          }
        ];
        
        setSearchResults(resultadosSimulados);
        setSearchParameters({ origin: newOrigin, destination: newDestination, departureDate: date });
        window.scrollTo(0, 0);
        console.log("Search results and parameters updated.");
      }, 1000);

    } catch (error) {
      console.error("Error updating search:", error);
      alert("Ocurrió un error al actualizar la búsqueda. Por favor, inténtalo de nuevo.");
    }
  };

  const handleSearchStart = () => {
    console.log("Search started")
  }

  const handleSearchError = (error: string) => {
    console.error("Search error:", error)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {showResults && searchParameters ? (
          <SearchResultsPage
            origin={searchParameters.origin}
            destination={searchParameters.destination}
            initialDepartureDate={searchParameters.departureDate}
            searchResults={searchResults}
            onGoToHomeSearch={handleGoToHomeSearch}
            onUpdateSearch={handleUpdateSearch}
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
                  onSearchStart={handleSearchStart}
                  onSearchError={handleSearchError}
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
