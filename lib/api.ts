import axios from "axios"

export interface Parada {
  id: string
  idExterno: number
  descripcion: string
  empresaNombre: string
  empresaId: string
}

export interface Pasaje {
  id: string
  origen: string
  destino: string
  fechaSalida: string
  fechaLlegada: string
  horaSalida: string
  horaLlegada: string
  duracion: string
  empresa: string
  tipoServicio: string
  precio: number
  moneda: string
  asientosDisponibles: number
}

export interface Trip {
  id: string;                 // Mapped from API: Id (Ej: "94613")
  uniqueKey: string;          // Generated unique key for React list rendering
  empresaNombre: string;      // Mapped from the parent object in API: empresa (Ej: "Canindeyu")
  fechaembarque: string;      // Mapped from API: fechaembarque (Ej: "2025-06-03T00:00:00-03:00")
  tipoServicio: string;       // Mapped from API: Calidad (Ej: "CN", "SC")
  asientosDisponibles: number;// Mapped from API: Libres (Ej: "10", needs parsing to number)
  precio: number;             // Mapped from API: Tarifa (Ej: "110000.00", needs parsing to number)
  rawEmbarque: string;        // Mapped from API: Embarque (Ej: "03/06 00:00")
  rawDesembarque: string;     // Mapped from API: Desembarque (Ej: "03/06 01:20")
  codServicio?: string;       // Mapped from API: Cod (Ej: "A001")
  empresaCod?: string;        // Mapped from API: Emp (Ej: "CYU")
}

export async function searchParadas(searchTerm: string): Promise<Parada[]> {
  if (!searchTerm || searchTerm.length < 2) return []

  try {
    const response = await axios.get(`/api/search-paradas?searchTerm=${searchTerm}`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await axios.get("/api/search-paradas?searchTerm=test")
    return true
  } catch {
    return false
  }
}

// Función para llamar a la nueva API POST /api/paradas y obtener viajes
export async function getTripsFromApi(originIds: number[], destinationIds: number[], date: string): Promise<Trip[]> {
  const endpoint = 'http://srv815070.hstgr.cloud:3001/api/paradas';
  console.log('Llamando a getTripsFromApi con:', { origin: originIds, destino: destinationIds, fecha: date });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: originIds,
        destino: destinationIds,
        fecha: date,
      }),
    });

    if (!response.ok) {
      let errorMsg = `API response was not ok: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMsg += ` - ${JSON.stringify(errorBody)}`;
      } catch (e) {
        // No body or not json
      }
      console.error(errorMsg);
      // Lanza un error específico para que pueda ser capturado y mostrado al usuario si es necesario
      throw new Error(`Error al contactar el servicio de búsqueda de viajes (${response.status}).`);
    }

    const apiResponseData = await response.json();
    console.log("API Response Data:", apiResponseData);

    const allTrips: Trip[] = [];

    if (Array.isArray(apiResponseData)) {
      apiResponseData.forEach((empresaData: any) => {
        if (empresaData && empresaData.success && Array.isArray(empresaData.data)) {
          const empresaNombre = empresaData.empresa || "Empresa Desconocida";
          empresaData.data.forEach((rawTrip: any) => {
            // Validar que los campos necesarios existan y sean del tipo esperado
            if (!rawTrip.Id || typeof rawTrip.fechaembarque !== 'string' || !rawTrip.fechaembarque.trim()) {
              console.warn("Viaje omitido por datos incompletos o inválidos:", rawTrip);
              return; // Saltar este viaje
            }

            const asientosDisponibles = parseInt(rawTrip.Libres, 10);
            const precio = parseFloat(rawTrip.Tarifa);

            if (isNaN(asientosDisponibles) || isNaN(precio)) {
                console.warn("Viaje omitido debido a 'Libres' o 'Tarifa' inválidos:", rawTrip);
                return; // Saltar este viaje si los números no son válidos
            }

            // Generar una clave única combinando el ID de la empresa (si existe) y el ID del viaje
            const empresaApiId = empresaData.id || `emp-${empresaData.empresa}`.replace(/\s+/g, '-'); // Usar el ID de empresa de la API o generar uno a partir del nombre
            const uniqueKey = `${empresaApiId}-${rawTrip.Id}`;

            allTrips.push({
              id: String(rawTrip.Id),
              uniqueKey: uniqueKey, // Asignar la clave única
              empresaNombre: empresaNombre,
              fechaembarque: rawTrip.fechaembarque,
              tipoServicio: rawTrip.Calidad || "No especificado",
              asientosDisponibles: asientosDisponibles,
              precio: precio,
              rawEmbarque: rawTrip.Embarque || "",
              rawDesembarque: rawTrip.Desembarque || "",
              codServicio: rawTrip.Cod,
              empresaCod: rawTrip.Emp,
            });
          });
        }
      });
      console.log("Processed Trips:", allTrips);
      return allTrips;
    } else {
      console.error("API response was not an array as expected at the root level:", apiResponseData);
      return [];
    }

  } catch (error) {
    console.error("Error en getTripsFromApi:", error);
    if (error instanceof Error && error.message.startsWith("Error al contactar el servicio")) {
        throw error; // Re-lanzar errores específicos de la respuesta de la API
    }
    // Para otros errores (de red, JSON parse, etc.)
    throw new Error("No se pudieron obtener los viajes. Verifica tu conexión o inténtalo más tarde.");
  }
}
