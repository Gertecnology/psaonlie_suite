import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAgenciasList } from '../../dashboard/hooks/use-agencias-list'
import { useCreateClient, useUpdateClient } from './use-client-mutations'
import { useClientePorEmail } from './use-clients'
import { useTiposDocumentoByEmpresa } from './use-tipos-documento'

/**
 * Everything the client form does that is not rendering.
 *
 * The 583-line drawer this replaces mixed the schema, two mutations, three
 * catalogue queries and the whole submit orchestration into the same file as
 * its markup. Splitting it puts the two very different modes side by side: a
 * creation that syncs against a company's web service, and an edit that only
 * writes local fields.
 */
const schema = z.object({
  email: z.string().email('El email no es válido.'),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  apellido: z.string().min(1, 'El apellido es requerido.'),
  agenciaId: z.string(),
  tipoDocumento: z.string(),
  numeroDocumento: z.string(),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida.'),
  sexo: z.string().min(1, 'El sexo es requerido.'),
  nacionalidad: z.string().min(1, 'La nacionalidad es requerida.'),
  paisResidencia: z.string().min(1, 'El país de residencia es requerido.'),
  telefono: z.string().min(1, 'El teléfono es requerido.'),
  ocupacion: z.string(),
  observaciones: z.string(),
})

export type ClientFormValues = z.infer<typeof schema>

const EMPTY: ClientFormValues = {
  email: '',
  nombre: '',
  apellido: '',
  agenciaId: '',
  tipoDocumento: '',
  numeroDocumento: '',
  fechaNacimiento: '',
  sexo: '',
  nacionalidad: '',
  paisResidencia: '',
  telefono: '',
  ocupacion: '',
  observaciones: '',
}

/**
 * `<input type='date'>` only understands `yyyy-MM-dd`.
 *
 * The API answers with a full ISO timestamp, and the browser silently blanks a
 * date field it cannot parse — so the form looked like the client had no birth
 * date, and saving wrote that emptiness back.
 */
function toCalendarDate(value: string | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

/**
 * @param email - The client's identity for this API (`/api/clientes/:email`).
 *   Absent when creating.
 */
export function useClientForm(email?: string) {
  const navigate = useNavigate()
  const isEdit = Boolean(email)

  const clientQuery = useClientePorEmail(email ?? '')
  const client = clientQuery.data

  const create = useCreateClient()
  const update = useUpdateClient()

  const companiesQuery = useAgenciasList()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(
      /**
       * Company, document type and document number only exist while creating:
       * the update endpoint does not accept them and the record is already tied
       * to a company. Demanding them on edit is what left the old drawer with
       * every field disabled and a save button that could never fire.
       */
      schema.superRefine((values, ctx) => {
        if (isEdit) return

        const required = [
          ['agenciaId', 'La empresa es requerida.'],
          ['tipoDocumento', 'El tipo de documento es requerido.'],
          ['numeroDocumento', 'El número de documento es requerido.'],
          ['ocupacion', 'La ocupación es requerida.'],
        ] as const

        for (const [field, message] of required) {
          if (!values[field]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message,
              path: [field],
            })
          }
        }
      }),
    ),
    defaultValues: EMPTY,
  })

  /**
   * The form is filled once, when the record first arrives — never again.
   *
   * Keying on the id means a background refetch of the same client cannot wipe
   * whatever the user is typing.
   */
  const loadedId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!client || loadedId.current === client.id) return

    loadedId.current = client.id
    form.reset({
      ...EMPTY,
      email: client.email,
      nombre: client.nombre,
      apellido: client.apellido,
      fechaNacimiento: toCalendarDate(client.fechaNacimiento),
      sexo: client.sexo ?? '',
      nacionalidad: client.nacionalidad ?? '',
      paisResidencia: client.paisResidencia ?? '',
      telefono: client.telefono ?? '',
      ocupacion: client.ocupacion ?? '',
      observaciones: client.observaciones ?? '',
    })
  }, [client, form])

  const agenciaId = form.watch('agenciaId')

  const documentTypesQuery = useTiposDocumentoByEmpresa(agenciaId || undefined)

  /**
   * A document type belongs to one company, so switching company invalidates
   * the type chosen before it.
   *
   * Only a real change clears it: the previous version also ran on the first
   * render, which would erase a value the form had just loaded.
   */
  const previousCompany = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (previousCompany.current === null) {
      previousCompany.current = agenciaId
      return
    }
    if (previousCompany.current === agenciaId) return

    previousCompany.current = agenciaId
    form.setValue('tipoDocumento', '')
  }, [agenciaId, form])

  const backToList = React.useCallback(() => {
    void navigate({ to: '/clients' })
  }, [navigate])

  const save = form.handleSubmit((values) => {
    // Sólo se navega si la operación salió bien: si falla, el formulario se
    // queda con todo lo cargado y el error a la vista.
    if (isEdit && email) {
      update.mutate(
        {
          email,
          data: {
            nombre: values.nombre,
            apellido: values.apellido,
            fechaNacimiento: values.fechaNacimiento,
            sexo: values.sexo,
            nacionalidad: values.nacionalidad,
            paisResidencia: values.paisResidencia,
            telefono: values.telefono,
            ocupacion: values.ocupacion,
            observaciones: values.observaciones,
          },
        },
        {
          onSuccess: () => {
            toast.success('Cliente actualizado')
            backToList()
          },
          onError: (error: Error) =>
            toast.error(`Error al actualizar el cliente: ${error.message}`),
        },
      )
      return
    }

    create.mutate(values, {
      onSuccess: () => {
        toast.success('Cliente creado')
        backToList()
      },
      onError: (error: Error) =>
        toast.error(`Error al crear el cliente: ${error.message}`),
    })
  })

  return {
    form,
    save,
    saving: create.isPending || update.isPending,
    isEdit,
    companies: companiesQuery.data?.data ?? [],
    loadingCompanies: companiesQuery.isLoading,
    documentTypes: documentTypesQuery.data,
    loadingDocumentTypes: documentTypesQuery.isLoading,
    agenciaId,
    loading: isEdit && clientQuery.isLoading,
    error: clientQuery.error,
    backToList,
    hasUnsavedChanges: form.formState.isDirty,
  }
}
