import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { type CreateServiceChargeFormValues } from '../models/service-charge.model'
import { useCreateServiceCharge } from './use-create-service-charge'
import { useGetServiceCharge } from './use-get-service-charge'
import { useUpdateServiceCharge } from './use-update-service-charge'

/**
 * Everything the service charge form does that is not rendering.
 *
 * It used to live inside a 459-line drawer: the schema, the two mutations, the
 * record loading and two copies of the empty values, all next to the markup.
 * Pulled out here, the rules that decide what gets written are readable — and
 * testable — on their own.
 */

/** Digits with an optional decimal part. The API keeps percentages as text. */
const NUMERIC = /^\d+(\.\d+)?$/

const schema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido.'),
    // Empty strings instead of `null`: an `<input>` cannot hold null without
    // React switching it to uncontrolled halfway through. The nulls the API
    // wants are rebuilt in `payload`.
    descripcion: z.string(),
    porcentaje: z.string(),
    tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO']),
    montoFijo: z
      .number()
      .min(0, 'El monto fijo no puede ser negativo.')
      .optional(),
    montoMinimo: z
      .number()
      .min(0, 'El monto mínimo no puede ser negativo.')
      .optional(),
    montoMaximo: z
      .number()
      .min(0, 'El monto máximo no puede ser negativo.')
      .optional(),
    fechaInicio: z.string().min(1, 'La fecha de inicio es requerida.'),
    fechaFin: z.string().min(1, 'La fecha de fin es requerida.'),
    esGlobal: z.boolean(),
    activo: z.boolean(),
  })
  .superRefine((values, ctx) => {
    /**
     * Each error lands on the field that has to change.
     *
     * The drawer reported every one of these on `tipoAplicacion`, so a missing
     * percentage complained under the "Tipo de aplicación" selector — pointing
     * the user at the one field that was already right.
     */
    if (values.tipoAplicacion === 'PORCENTUAL') {
      const porcentaje = values.porcentaje.trim()

      if (!porcentaje) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El porcentaje es requerido.',
          path: ['porcentaje'],
        })
      } else if (!NUMERIC.test(porcentaje) || Number(porcentaje) > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El porcentaje tiene que ser un número entre 0 y 100.',
          path: ['porcentaje'],
        })
      }
    }

    if (values.tipoAplicacion === 'FIJO' && values.montoFijo === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El monto fijo es requerido.',
        path: ['montoFijo'],
      })
    }

    if (
      values.montoMinimo !== undefined &&
      values.montoMaximo !== undefined &&
      values.montoMinimo > values.montoMaximo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El monto máximo no puede ser menor que el mínimo.',
        path: ['montoMaximo'],
      })
    }

    // Las dos fechas viajan como `yyyy-MM-dd`, así que comparar los textos
    // alcanza y evita construir dos `Date` con la zona horaria del navegador.
    if (
      values.fechaInicio &&
      values.fechaFin &&
      values.fechaFin < values.fechaInicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de fin no puede ser anterior a la de inicio.',
        path: ['fechaFin'],
      })
    }
  })

export type ServiceChargeFormFields = z.infer<typeof schema>

const EMPTY: ServiceChargeFormFields = {
  nombre: '',
  descripcion: '',
  porcentaje: '',
  tipoAplicacion: 'PORCENTUAL',
  montoFijo: undefined,
  montoMinimo: undefined,
  montoMaximo: undefined,
  fechaInicio: '',
  fechaFin: '',
  esGlobal: false,
  activo: true,
}

/**
 * `<input type='date'>` only understands `yyyy-MM-dd`.
 *
 * The API answers with a full ISO timestamp, and the browser silently blanks a
 * date field it cannot parse — so an existing charge opened for editing showed
 * two empty dates, and saving wrote that emptiness back over its validity
 * window.
 */
function toCalendarDate(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

/**
 * The payload the API gets, with the fields the chosen type does not use
 * cleared.
 *
 * Switching a charge from fixed to percentage used to leave its old `montoFijo`
 * in place — invisible in the form, still stored, and still there to be applied
 * by whoever reads the record next.
 */
function payload(
  values: ServiceChargeFormFields
): CreateServiceChargeFormValues {
  const esPorcentual = values.tipoAplicacion === 'PORCENTUAL'

  return {
    nombre: values.nombre,
    descripcion: values.descripcion.trim() || null,
    porcentaje: esPorcentual ? values.porcentaje.trim() : null,
    tipoAplicacion: values.tipoAplicacion,
    montoFijo: esPorcentual ? undefined : values.montoFijo,
    montoMinimo: esPorcentual ? undefined : values.montoMinimo,
    montoMaximo: esPorcentual ? undefined : values.montoMaximo,
    fechaInicio: values.fechaInicio,
    fechaFin: values.fechaFin,
    esGlobal: values.esGlobal,
    activo: values.activo,
  }
}

/**
 * @param serviceChargeId - Absent when creating.
 */
export function useServiceChargeForm(serviceChargeId?: string) {
  const navigate = useNavigate()
  const isEdit = Boolean(serviceChargeId)

  const serviceChargeQuery = useGetServiceCharge(serviceChargeId)
  const serviceCharge = serviceChargeQuery.data

  const create = useCreateServiceCharge()
  const update = useUpdateServiceCharge()

  const form = useForm<ServiceChargeFormFields>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  /**
   * The form is filled once, when the record first arrives — never again.
   *
   * The drawer had the record itself among the effect's dependencies, and that
   * object is new on every refetch, so any background refresh called
   * `form.reset()` and **wiped whatever the user was typing**. Keying on the id
   * means a refetch of the same charge changes nothing on screen.
   */
  const loadedId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!serviceCharge || loadedId.current === serviceCharge.id) return

    loadedId.current = serviceCharge.id
    form.reset({
      nombre: serviceCharge.nombre,
      descripcion: serviceCharge.descripcion ?? '',
      porcentaje: serviceCharge.porcentaje ?? '',
      tipoAplicacion: serviceCharge.tipoAplicacion,
      // `?? undefined` y no `|| undefined`: un monto de 0 es un monto, y el
      // `||` lo borraba del formulario.
      montoFijo: serviceCharge.montoFijo ?? undefined,
      montoMinimo: serviceCharge.montoMinimo ?? undefined,
      montoMaximo: serviceCharge.montoMaximo ?? undefined,
      fechaInicio: toCalendarDate(serviceCharge.fechaInicio),
      fechaFin: toCalendarDate(serviceCharge.fechaFin),
      esGlobal: serviceCharge.esGlobal,
      activo: serviceCharge.activo,
    })
  }, [serviceCharge, form])

  const backToList = React.useCallback(() => {
    void navigate({ to: '/settings/service-charges' })
  }, [navigate])

  const save = form.handleSubmit((values) => {
    // Sólo se navega si la operación salió bien: si falla, el formulario se
    // queda con todo lo cargado y el error a la vista.
    if (isEdit && serviceChargeId) {
      update.mutate(
        { id: serviceChargeId, data: payload(values) },
        { onSuccess: backToList }
      )
      return
    }

    create.mutate(payload(values), { onSuccess: backToList })
  })

  return {
    form,
    save,
    saving: create.isPending || update.isPending,
    isEdit,
    tipoAplicacion: form.watch('tipoAplicacion'),
    loading: isEdit && serviceChargeQuery.isLoading,
    error: serviceChargeQuery.error,
    backToList,
    hasUnsavedChanges: form.formState.isDirty,
    /**
     * El nombre tal como está guardado. Titula la página: usar el del
     * formulario haría que el encabezado se reescriba letra por letra.
     */
    nombreGuardado: serviceChargeQuery.data?.nombre ?? null,
    /**
     * Las empresas que aplican este cargo.
     *
     * Hoy se asignan desde un menú de la fila del listado y no se ven en
     * ningún lado: no hay forma de saber a quiénes les pega un cargo.
     */
    empresas: serviceChargeQuery.data?.empresas ?? [],
  }
}
