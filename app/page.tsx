"use client"

import { useState } from "react"
import Image from "next/image"
import { SearchForm } from "@/components/search-form"
import { SearchResults } from "@/components/search-results"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SearchTips } from "@/components/search-tips"
import type { Pasaje } from "@/lib/api"

export default function Home() {
  const [searchResults, setSearchResults] = useState<Pasaje[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearchStart = () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
  }

  const handleSearchResults = (results: Pasaje[]) => {
    setSearchResults(results)
    setIsSearching(false)
    setSearchError(null)
  }

  const handleSearchError = (error: string) => {
    setSearchError(error)
    setIsSearching(false)
    setSearchResults([])
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          {/* Título centrado */}
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

          {/* Formulario de búsqueda */}
          <div className="bg-gradient-to-b from-gray-50 to-white pb-8">
            <div className=" mx-auto px-4">
              <SearchForm
                onSearchStart={handleSearchStart}
                onSearchResults={handleSearchResults}
                onSearchError={handleSearchError}
              />
            </div>
          </div>

          {/* Imagen de fondo - solo mostrar si no hay búsqueda activa */}
          {!hasSearched && (
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

        {/* Resultados de búsqueda */}
        {hasSearched && (
          <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-4">
              <SearchResults pasajes={searchResults} isLoading={isSearching} error={searchError} />
            </div>
          </section>
        )}

        {/* Tips de Búsqueda - solo mostrar si no hay búsqueda activa */}
        {!hasSearched && <SearchTips />}
      </main>
      <Footer />
    </div>
  )
}
