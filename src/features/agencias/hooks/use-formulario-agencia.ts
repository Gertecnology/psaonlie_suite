import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { esEmpresa, type CrearAgenciaFormValues } from '../models/agencia.model'
import { useAgencia } from './use-agencias'
import { useCrearAgencia } from './use-crear-agencia'
import { useActualizarAgencia } from './use-actualizar-agencia'
import { useActualizarLogoAgencia } from './use-actualizar-logo-agencia'

/**
 * Everything the agency form does that is not rendering.
 *
 * It used to live inside a 518-line drawer alongside 270 lines of JSX: the
 * schema, three mutations, the conditional field whitelist, the four-branch
 * save orchestration and the image preview. Splitting it is what makes the
 * saving rules readable on their own — and testable without a DOM.
 */
const esquema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  usuario: z.string().nullable().optional(),
  password: z.string().optional(),
  agenciaPrincipal: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  activo: z.boolean(),
  porcentajeVentas: z.number().optional(),
  profileImage: z.instanceof(File).optional(),
})

export type ValoresFormularioAgencia = z.infer<typeof esquema>

const VACIO: ValoresFormularioAgencia = {
  nombre: '',
  usuario: '',
  password: '',
  agenciaPrincipal: '',
  descripcion: '',
  url: '',
  activo: true,
  porcentajeVentas: undefined,
  profileImage: undefined,
}

/** Images the backend accepts, and a ceiling it will reject anyway. */
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024

export function useFormularioAgencia(agenciaId?: string) {
  const navigate = useNavigate()
  const esEdicion = Boolean(agenciaId)

  const consulta = useAgencia(agenciaId, esEdicion)
  const agencia = consulta.data

  const crear = useCrearAgencia()
  const actualizar = useActualizarAgencia()
  const actualizarLogo = useActualizarLogoAgencia()

  const esHija = Boolean(agencia && !esEmpresa(agencia))
  const heredaComision = esHija && agencia?.heredaComision !== false

  /**
   * The parent's commission, fetched rather than guessed.
   *
   * A child that inherits charges what its parent charges, and the child's own
   * record does not carry that figure — only `padreId`. Showing the child's own
   * `porcentajeVentas` instead would display a 0% next to a "Heredada" badge,
   * which is exactly the wrong number for the one field that decides money.
   * Only asked for when it is actually going to be shown.
   */
  const padre = useAgencia(
    agencia?.padreId ?? undefined,
    Boolean(heredaComision && agencia?.padreId),
  )
  const comisionHeredada = padre.data?.porcentajeVentas ?? null

  const guardando =
    crear.isPending || actualizar.isPending || actualizarLogo.isPending

  const [vistaPreviaLogo, setVistaPreviaLogo] = React.useState<string | null>(
    null,
  )
  const [errorLogo, setErrorLogo] = React.useState<string | null>(null)

  const form = useForm<ValoresFormularioAgencia>({
    resolver: zodResolver(
      esquema.superRefine((datos, ctx) => {
        if (!esEdicion && (!datos.password || datos.password.length < 6)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La contraseña debe tener al menos 6 caracteres.',
            path: ['password'],
          })
        }
      }),
    ),
    defaultValues: VACIO,
  })

  const { dirtyFields } = form.formState

  /**
   * The form is filled once, when the record first arrives — never again.
   *
   * The previous version had the agency object in the effect's dependencies,
   * and that object is new on every refetch. So any background refresh called
   * `form.reset()` and **wiped whatever the user was typing**. Keying on the id
   * means a refetch of the same record changes nothing on screen.
   */
  const idCargado = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!agencia || idCargado.current === agencia.id) return

    idCargado.current = agencia.id
    form.reset({
      nombre: agencia.nombre,
      usuario: agencia.usuario,
      // Nunca se precarga: la API no la devuelve y mostrar algo sería mentir.
      password: '',
      agenciaPrincipal: agencia.agenciaPrincipal,
      descripcion: agencia.descripcion,
      url: agencia.url,
      activo: agencia.activo,
      porcentajeVentas: agencia.porcentajeVentas
        ? parseFloat(agencia.porcentajeVentas)
        : undefined,
      profileImage: undefined,
    })
    setVistaPreviaLogo(agencia.imageUrl ?? null)
  }, [agencia, form])

  const elegirLogo = React.useCallback(
    (archivo: File | undefined) => {
      setErrorLogo(null)
      if (!archivo) return

      // Se valida acá y no al guardar: enterarse de que el archivo no servía
      // después de completar el formulario entero es la peor versión de este
      // error.
      if (!TIPOS_IMAGEN.includes(archivo.type)) {
        setErrorLogo('El logo tiene que ser una imagen JPG, PNG, WEBP o SVG.')
        return
      }
      if (archivo.size > TAMANO_MAXIMO_LOGO) {
        setErrorLogo('El logo no puede pesar más de 2 MB.')
        return
      }

      form.setValue('profileImage', archivo, { shouldDirty: true })

      const lector = new FileReader()
      lector.onloadend = () => setVistaPreviaLogo(lector.result as string)
      lector.readAsDataURL(archivo)
    },
    [form],
  )

  const volverAlListado = React.useCallback(() => {
    void navigate({ to: '/agencias' })
  }, [navigate])

  /**
   * Fields the API accepts for this record.
   *
   * A child agency has no connection of its own — sending it `url`, `usuario`
   * or `agenciaPrincipal` would write values the model says cannot exist at
   * that level — and its commission, when inherited, belongs to the parent.
   */
  const camposPermitidos = (datos: ValoresFormularioAgencia) => {
    const { password: _clave, profileImage: _logo, ...resto } = datos

    if (!esHija) {
      return {
        ...resto,
        porcentajeVentas: resto.porcentajeVentas?.toString() || null,
      }
    }

    return {
      nombre: resto.nombre,
      descripcion: resto.descripcion,
      activo: resto.activo,
      ...(heredaComision
        ? {}
        : { porcentajeVentas: resto.porcentajeVentas?.toString() || null }),
    }
  }

  const guardar = form.handleSubmit((datos) => {
    if (!esEdicion) {
      const nueva: CrearAgenciaFormValues = {
        ...datos,
        password: datos.password || '',
        url: datos.url || undefined,
        profileImage: datos.profileImage || undefined,
      }

      // Sólo se navega si la creación salió bien: si falló, el formulario se
      // queda con todo lo cargado y el error a la vista.
      crear.mutate(nueva, { onSuccess: volverAlListado })
      return
    }

    if (!agencia?.id) return

    // Se compara con `dirtyFields` y no contra la agencia: la API devuelve
    // "5.00" donde el formulario produce 5, así que un `!==` daba la comisión
    // por modificada siempre.
    const cambiaronDatos = Object.keys(dirtyFields).some(
      (campo) => campo !== 'profileImage' && campo !== 'password',
    )
    const cambioLogo = Boolean(datos.profileImage)
    const id = agencia.id

    if (cambioLogo && cambiaronDatos) {
      actualizar.mutate(
        { id, data: camposPermitidos(datos) },
        {
          onSuccess: () =>
            actualizarLogo.mutate(
              { id, profileImage: datos.profileImage! },
              { onSuccess: volverAlListado },
            ),
        },
      )
      return
    }

    if (cambioLogo) {
      actualizarLogo.mutate(
        { id, profileImage: datos.profileImage! },
        { onSuccess: volverAlListado },
      )
      return
    }

    if (cambiaronDatos) {
      actualizar.mutate(
        { id, data: camposPermitidos(datos) },
        { onSuccess: volverAlListado },
      )
      return
    }

    // Nada cambió: no se manda una petición que no tiene qué escribir.
    volverAlListado()
  })

  return {
    form,
    guardar,
    guardando,
    esEdicion,
    esHija,
    heredaComision,
    comisionHeredada,
    cargando: esEdicion && consulta.isLoading,
    error: consulta.error,
    vistaPreviaLogo,
    errorLogo,
    elegirLogo,
    volverAlListado,
    hayCambiosSinGuardar: form.formState.isDirty,
    /**
     * El nombre tal como está guardado. Titula la página: usar el del
     * formulario haría que el encabezado se reescriba letra por letra mientras
     * se corrige el nombre.
     */
    nombreGuardado: consulta.data?.nombre ?? null,
  }
}
