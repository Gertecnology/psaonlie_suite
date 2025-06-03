"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Parada, Trip } from "@/lib/api";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  MapPin,
  Calendar,
  Users,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  isSameDay,
  eachDayOfInterval,
  parseISO,
  startOfDay
} from "date-fns";
import { es } from "date-fns/locale";

interface SearchResultsPageProps {
  origin: Parada;
  destination: Parada;
  initialDepartureDate: Date;
  searchResults: Trip[];
  onGoToHomeSearch: () => void;
  onUpdateSearch: (originText: string, destinationText: string, date: Date) => void;
}

export function SearchResultsPage({
  origin,
  destination,
  initialDepartureDate,
  searchResults,
  onGoToHomeSearch,
  onUpdateSearch,
}: SearchResultsPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(initialDepartureDate));

  const [editableOriginText, setEditableOriginText] = useState(origin.descripcion);
  const [editableDestinationText, setEditableDestinationText] = useState(destination.descripcion);
  const [editableDate, setEditableDate] = useState<Date | undefined>(initialDepartureDate);

  useEffect(() => {
    setEditableOriginText(origin.descripcion);
    setEditableDestinationText(destination.descripcion);
    setEditableDate(initialDepartureDate);
    setSelectedDate(startOfDay(initialDepartureDate));
  }, [origin, destination, initialDepartureDate]);

  const filteredTrips = useMemo(() => {
    return searchResults.filter(trip => {
      try {
        const tripDate = startOfDay(parseISO(trip.fechaSalida));
        return isSameDay(tripDate, selectedDate);
      } catch (e) {
        console.error("Error parsing trip date:", trip.fechaSalida, e);
        return false;
      }
    });
  }, [searchResults, selectedDate]);

  const dateRange = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(selectedDate, 2),
      end: addDays(selectedDate, 2),
    });
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(startOfDay(date));
  };

  const handlePrevDate = () => {
    setSelectedDate(prev => startOfDay(subDays(prev, 1)));
  };

  const handleNextDate = () => {
    setSelectedDate(prev => startOfDay(addDays(prev, 1)));
  };

  const renderDateNavigator = () => (
    <div className="bg-white p-3 mb-6 rounded-lg shadow flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={handlePrevDate} className="text-gray-600 hover:bg-gray-100">
        <ChevronLeft className="w-6 h-6" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline"
            className="text-base font-medium text-gray-700 hover:bg-gray-50 border-gray-300 px-4 py-2 rounded-md w-auto min-w-[200px] text-center"
          >
            {format(selectedDate, "eeee, dd 'de' MMMM", { locale: es })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                handleDateChange(date);
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={handleNextDate} className="text-gray-600 hover:bg-gray-100">
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header específico de la página de resultados eliminado
      <header className="bg-white shadow-sm py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">pasajeonline</h1>
          <Button variant="outline" className="text-sm">
            <Users className="w-4 h-4 mr-2" />
            MI CUENTA
          </Button>
        </div>
      </header>
      */}

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Search Summary Form-Like Display adjusted to be identical to SearchForm */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            
            {/* Origen Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Lugar de salida</span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="origin-summary"
                  value={editableOriginText}
                  onChange={(e) => setEditableOriginText(e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pl-10 transition-all w-full"
                  placeholder="Lugar de salida"
                />
              </div>
            </div>

            {/* Destino Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Lugar de llegada</span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="destination-summary"
                  value={editableDestinationText}
                  onChange={(e) => setEditableDestinationText(e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 hover:border-red-300 focus:border-red-500 focus:ring-red-500 rounded-lg pl-10 transition-all w-full"
                  placeholder="Lugar de llegada"
                />
              </div>
            </div>

            {/* Fecha Ida Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>Ida</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    className="h-12 w-full justify-start text-left font-normal border-2 border-gray-300 hover:border-blue-500 rounded-lg text-base pl-3 pr-3"
                  >
                    {editableDate ? format(editableDate, "dd/MM/yyyy", { locale: es }) : <span>dd/mm/aaaa</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editableDate}
                    onSelect={setEditableDate}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* "Actualizar Búsqueda" Button */}
            <Button 
              onClick={() => {
                if (editableOriginText && editableDestinationText && editableDate) {
                  onUpdateSearch(editableOriginText, editableDestinationText, editableDate);
                }
              }}
              disabled={!editableOriginText || !editableDestinationText || !editableDate}
              className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-lg transition-all duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
            >
              Actualizar Búsqueda
            </Button>
          </div>
        </div>

        {renderDateNavigator()}

        {/* Results List */}
        <div className="mt-2">
          {filteredTrips.length > 0 ? (
            filteredTrips.map(trip => <TripCard key={trip.id} trip={trip} />)
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay viajes disponibles para el {format(selectedDate, "dd 'de' MMMM", { locale: es })}.
              </h3>
              <p className="text-gray-500">Intenta seleccionar otra fecha o ajusta tu búsqueda.</p>
            </div>
          )}
        </div>
        {/* {activeTab === 'resumen' && <div className="text-center p-10 bg-white rounded-lg shadow"><p>Pestaña Resumen (en construcción)</p></div>} */}
        {/* {activeTab === 'pago' && <div className="text-center p-10 bg-white rounded-lg shadow"><p>Pestaña Pago (en construcción)</p></div>} */}

      </main>
    </div>
  );
} 