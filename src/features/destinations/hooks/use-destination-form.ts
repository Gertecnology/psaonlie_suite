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
    })
  }, [destination, form])

  /**
   * Options for the stop selector.
   *
   * The catalogue endpoint only lists stops that are still available, so a stop
   * already attached to this destination can be missing from it. Merging the
   * record's own stops in first keeps them visible instead of silently dropping
   * them from the selection the moment the form loads.
   */
  const paradaOptions = React.useMemo<ParadaOption[]>(() => {
    const catalogo: ParadaOption[] = (paradasQuery.data ?? []).map((parada) => ({
      value: parada.id,
      label: parada.descripcion,
    }))

    if (!isEdit || !destination) return catalogo

    const yaSeleccionadas: ParadaOption[] = (
      destination.paradasHomologadas ?? []
    ).map((parada) => ({ value: parada.id, label: parada.nombre }))

    const seleccionadas = new Set(
      yaSeleccionadas.map((opcion) => opcion.value),
    )

    return [
      ...yaSeleccionadas,
      ...catalogo.filter((opcion) => !seleccionadas.has(opcion.value)),
    ]
  }, [paradasQuery.data, isEdit, destination])

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
