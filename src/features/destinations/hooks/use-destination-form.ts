import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  destinationFormSchema,
  type DestinationFormValues,
} from '../models/destination.model'
import { useCreateDestination } from './use-create-destination'
import { useGetDestinationForEdit } from './use-get-destination-for-edit'
import { useGetParadasHomologadas } from './use-get-paradas-homologadas'
import { useUpdateDestination } from './use-update-destination'

/**
 * Everything the destination form does that is not rendering.
 *
 * It used to live inside a side drawer that took its record through props and
 * kept it in sync with three chained effects. Pulling the rules out here is
 * what makes them readable — and reviewable — on their own.
 */

const EMPTY: DestinationFormValues = {
  nombre: '',
  paradasHomologadasIds: [],
  // Un destino nuevo nace ofreciéndose: crear uno apagado y no entender por qué
  // no aparece en la búsqueda es un viaje de ida.
  activo: true,
  latitud: null,
  longitud: null,
}

interface ParadaOption {
  value: string
  label: string
}

export function useDestinationForm(destinationId?: string) {
  const navigate = useNavigate()
  const isEdit = Boolean(destinationId)

  const destinationQuery = useGetDestinationForEdit(destinationId ?? '', isEdit)
  const destination = destinationQuery.data

  const paradasQuery = useGetParadasHomologadas()

  const create = useCreateDestination()
  const update = useUpdateDestination()

  const form = useForm<DestinationFormValues>({
    // Una sola fuente de verdad para los valores iniciales: el formulario nace
    // vacío y el registro lo llena el efecto de abajo. Antes el registro entraba
    // por `defaultValues` y otra vez por un `reset`, y las dos ramas discrepaban.
    resolver: zodResolver(destinationFormSchema),
    defaultValues: EMPTY,
  })

  /**
   * The form is filled once, when the record first arrives — never again.
   *
   * The previous version compared the fetched record against the current values
   * with `JSON.stringify` and called `setValue` whenever they differed, on every
   * render. A background refetch therefore **overwrote whatever the user was
   * typing**. Keying on the id means a refetch of the same record changes
   * nothing on screen.
   */
  const loadedId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!destination || loadedId.current === destination.id) return

    loadedId.current = destination.id
    form.reset({
      nombre: destination.nombre,
      paradasHomologadasIds: (destination.paradasHomologadas ?? []).map(
        (parada) => parada.id,
      ),
      activo: destination.activo,
      latitud: destination.latitud ?? null,
      longitud: destination.longitud ?? null,
    })
  }, [destination, form])

  /**
   * Options for the stop selector.
   *
   * Every stop is listed, not only the unassigned ones — the catalogue used to
   * filter those, and since none were left it came back empty, so no
   * destination could ever gain a stop.
   *
   * Each option says which company reports it and which destination holds it
   * today. A stop belongs to exactly one destination, so choosing one that is
   * taken moves it: that is how a bad homologation gets corrected, and it has
   * to be visible before it happens, not discovered afterwards in the other
   * destination.
   */
  const paradaOptions = React.useMemo<ParadaOption[]>(() => {
    return (paradasQuery.data ?? []).map((parada) => {
      const ajena =
        parada.destinoId && parada.destinoId !== destinationId
          ? parada.destinoNombre
          : null

      const partes = [
        parada.empresaNombre,
        ajena ? `hoy en «${ajena}» — se mueve acá` : null,
      ].filter(Boolean)

      return {
        value: parada.id,
        label: parada.descripcion,
        hint: partes.join(' · ') || undefined,
      }
    })
  }, [paradasQuery.data, destinationId])

  const backToList = React.useCallback(() => {
    void navigate({ to: '/destinations' })
  }, [navigate])

  const save = form.handleSubmit((values) => {
    // Sólo se navega si la operación salió bien: si falla, el formulario se
    // queda con todo lo cargado y el error a la vista.
    if (isEdit && destinationId) {
      update.mutate(
        { id: destinationId, data: values },
        { onSuccess: backToList },
      )
      return
    }

    create.mutate(values, { onSuccess: backToList })
  })

  return {
    form,
    save,
    /** De dónde salió la ubicación guardada, para poder decirlo en pantalla. */
    precisionUbicacion: destination?.geocodingPrecision ?? null,
    saving: create.isPending || update.isPending,
    isEdit,
    paradaOptions,
    loadingOptions: paradasQuery.isLoading,
    loading: isEdit && destinationQuery.isLoading,
    error: destinationQuery.error,
    backToList,
    hasUnsavedChanges: form.formState.isDirty,
  }
}
