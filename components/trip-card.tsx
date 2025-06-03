"use client"

import { Trip } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Users, Hourglass, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const formatTime = (dateString: string, timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = parseISO(dateString);
      date.setHours(hours);
      date.setMinutes(minutes);
      return format(date, "HH:mm 'hs.'", { locale: es });
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString; // Fallback to original time string
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      // Sumar un día porque parseISO puede interpretarlo como UTC y llevarlo al día anterior
      // Dependerá de cómo se esté guardando la fecha originalmente.
      // Si la fecha ya está correcta, esta línea no es necesaria.
      // const correctedDate = addDays(date, 1); 
      return format(date, "eee. dd 'de' MMM.", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Fallback to original date string
    }
  };


  return (
    <Card className="bg-blue-900 text-white rounded-lg shadow-md overflow-hidden mb-4">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Columna Izquierda: Detalles del viaje */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xl font-semibold text-yellow-400">{trip.empresaNombre.toUpperCase()}</h3>
            <div className="flex items-center space-x-2 text-sm">
              <CalendarDays className="w-4 h-4 text-gray-300" />
              <span>Salida: {formatDate(trip.fechaSalida)}</span>
              <Clock className="w-4 h-4 text-gray-300" />
              <span>{formatTime(trip.fechaSalida, trip.horaSalida)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CalendarDays className="w-4 h-4 text-gray-300" />
              <span>Llegada: {formatDate(trip.fechaLlegada)}</span>
              <Clock className="w-4 h-4 text-gray-300" />
              <span>{formatTime(trip.fechaLlegada, trip.horaLlegada)}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-2">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-gray-300" />
                {trip.tipoServicio}
              </span>
              <span className="flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-gray-300" />
                {trip.asientosDisponibles} asientos libres
              </span>
              <span className="flex items-center">
                <Hourglass className="w-4 h-4 mr-1.5 text-gray-300" />
                {trip.duracionViajeFormato}
              </span>
            </div>
          </div>

          {/* Columna Derecha: Precio y Botón */}
          <div className="md:col-span-1 flex flex-col items-center md:items-end justify-center space-y-2">
            <p className="text-2xl font-bold text-white">
              {trip.moneda.toUpperCase()} {trip.precio.toLocaleString('es-PY')}
            </p>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full md:w-auto px-6 py-3 text-base">
              SELECCIONAR
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Necesitamos importar Card y CardContent de ShadCN UI
// Asegúrate de que estos componentes estén disponibles en tu proyecto
// Si no lo están, puedes usar divs simples con clases de Tailwind
// Por ejemplo:
// const Card = ({ className, children }) => <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
// const CardContent = ({ className, children }) => <div className={`p-6 ${className}`}>{children}</div>;

// Para este ejemplo, asumiré que tienes Card y CardContent de ShadCN UI instalados y configurados.
// Reemplaza esto con tu implementación real si es necesario.
// Este es un placeholder para que el código sea autocontenido para la herramienta de edición.
// const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => <div className={className}>{children}</div>;
// const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => <div className={className}>{children}</div>; 