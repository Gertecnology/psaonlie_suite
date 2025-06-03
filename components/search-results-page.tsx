"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Trip } from "@/lib/api";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  format,
  parseISO,
  startOfDay,
  isSameDay
} from "date-fns";
import { es } from "date-fns/locale";

interface SearchSummary {
  origin: string;
  destination: string;
  date: string; // Formato YYYY-MM-DD
}

interface SearchResultsPageProps {
  searchSummary: SearchSummary | null;
  trips: Trip[];
  isLoading: boolean;
  onUpdateSearch: (originText: string, destinationText: string, date: Date) => void;
  onNewSearch: () => void;
  searchErrorMsg: string | null;
  currentDate: Date;
  onDateChange: (directionOrDate: 'prev' | 'next' | Date) => void;
}

export function SearchResultsPage({
  searchSummary,
  trips,
  isLoading,
  onUpdateSearch,
  onNewSearch,
  searchErrorMsg,
  currentDate,
  onDateChange,
}: SearchResultsPageProps) {

  const [editableOriginText, setEditableOriginText] = useState(searchSummary?.origin || "");
  const [editableDestinationText, setEditableDestinationText] = useState(searchSummary?.destination || "");
  const [editableDate, setEditableDate] = useState<Date | undefined>(currentDate);

  useEffect(() => {
    if (searchSummary) {
      setEditableOriginText(searchSummary.origin);
      setEditableDestinationText(searchSummary.destination);
    }
  }, [searchSummary]);

  useEffect(() => {
    setEditableDate(startOfDay(currentDate));
  }, [currentDate]);

  const filteredTrips = useMemo(() => {
    if (isLoading) return [];
    if (!Array.isArray(trips)) {
        console.warn("`trips` no es un array:", trips);
        return [];
    }
    return trips.filter(trip => {
      if (!trip || typeof trip !== 'object') {
        console.warn("Elemento inválido en `trips` array (no es objeto):", trip);
        return false;
      }
      if (typeof trip.fechaembarque !== 'string' || !trip.fechaembarque.trim()) {
        console.warn(`Trip con fechaembarque inválida o ausente. ID: ${trip.id}, fechaembarque: '${trip.fechaembarque}'`);
        return false;
      }
      try {
        const tripDate = startOfDay(parseISO(trip.fechaembarque));
        return isSameDay(tripDate, currentDate);
      } catch (e) {
        console.error(`Error parsing trip date '${String(trip.fechaembarque)}' for trip ID ${trip.id}:`, e);
        return false;
      }
    });
  }, [trips, currentDate, isLoading]);

  const renderDateNavigator = () => (
    <div className="bg-white p-3 mb-6 rounded-lg shadow flex items-center justify-between sticky top-[var(--header-height)] z-10">
      <Button variant="ghost" size="icon" onClick={() => onDateChange('prev')} className="text-slate-600 hover:bg-slate-100">
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline"
            className="text-base font-medium text-slate-700 hover:bg-slate-50 border-slate-300 px-4 py-2 rounded-md w-auto min-w-[280px] text-center flex items-center justify-center shadow-sm"
          >
            <CalendarIcon className="w-5 h-5 mr-2.5 text-slate-500" />
            {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={currentDate}
            onSelect={(date) => {
              if (date) onDateChange(startOfDay(date));
            }}
            disabled={(date) => date < startOfDay(new Date())} 
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={() => onDateChange('next')} className="text-slate-600 hover:bg-slate-100">
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-stretch">
            {/* Origen - Col 1, Fila 1 */}
            <div className="space-y-1.5">
              <label htmlFor="origin-update-summary" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                Origen
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="origin-update-summary"
                  value={editableOriginText}
                  onChange={(e) => setEditableOriginText(e.target.value)}
                  className="h-12 text-base border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg pl-11 w-full shadow-sm transition-colors"
                  placeholder="ASUNCION"
                />
              </div>
            </div>

            {/* Destino - Col 2, Fila 1 */}
            <div className="space-y-1.5">
              <label htmlFor="destination-update-summary" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"></span>
                Destino
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="destination-update-summary"
                  value={editableDestinationText}
                  onChange={(e) => setEditableDestinationText(e.target.value)}
                  className="h-12 text-base border-slate-300 hover:border-red-400 focus:border-red-500 focus:ring-red-500/30 rounded-lg pl-11 w-full shadow-sm transition-colors"
                  placeholder="Arroyos y Esteros"
                />
              </div>
            </div>

            {/* Fecha Ida - Col 1, Fila 2 */}
            <div className="space-y-1.5">
              <label htmlFor="date-update-summary" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                Fecha Ida
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    id="date-update-summary"
                    className="h-12 w-full justify-start text-left font-normal text-base border-slate-300 hover:border-blue-400 focus:border-blue-500 text-slate-700 rounded-lg pl-3.5 pr-3 shadow-sm transition-colors"
                  >
                    {editableDate ? format(editableDate, "dd/MM/yyyy", { locale: es }) : <span className="text-slate-400">dd/mm/aaaa</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editableDate}
                    onSelect={(newDate) => {
                        if(newDate) setEditableDate(startOfDay(newDate));
                    }}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Botón Actualizar - Col 2, Fila 2, Span 2 Filas */}
            <div className="md:row-span-2 flex">
              <Button 
                onClick={() => {
                  if (editableOriginText && editableDestinationText && editableDate) {
                    onUpdateSearch(editableOriginText, editableDestinationText, editableDate);
                  }
                }}
                disabled={isLoading || !editableOriginText || !editableDestinationText || !editableDate}
                className="w-full h-full bg-red-600 hover:bg-red-700 text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <SearchIcon className="w-5 h-5 mr-2" />}
                Actualizar
              </Button>
            </div>

            {/* Botón Nueva Búsqueda - Col 1, Fila 3 */}
            <div> {/* Contenedor simple para el botón */}
              <Button 
                variant="outline"
                onClick={onNewSearch}
                className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 font-semibold text-base rounded-lg shadow-sm transition-all duration-150 ease-in-out"
              >
                Nueva Búsqueda
              </Button>
            </div>

          </div>
        </div>

        {renderDateNavigator()}
        
        {searchErrorMsg && !isLoading && (
          <Alert variant="destructive" className="mb-6 bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg flex items-start shadow-sm">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <AlertDescription className="font-medium text-sm">{searchErrorMsg}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col justify-center items-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-5" />
            <p className="text-xl font-semibold text-slate-700">Buscando viajes...</p>
            <p className="text-sm text-slate-500 mt-1">Esto puede tardar unos segundos.</p>
          </div>
        )}

        {!isLoading && !searchErrorMsg && filteredTrips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md mt-8">
            <CalendarIcon className="w-16 h-16 mx-auto text-slate-400 mb-5" />
            <h3 className="text-xl font-semibold text-slate-700 mb-1.5">
              No se encontraron viajes para el {format(currentDate, "dd 'de' MMMM", { locale: es })}.
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Puedes probar cambiando la fecha o realizando una nueva búsqueda con diferentes localidades.</p>
          </div>
        )}

        {!isLoading && filteredTrips.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {filteredTrips.map(trip => <TripCard key={trip.uniqueKey} trip={trip} />)}
          </div>
        )}
      </main>
    </div>
  );
} 