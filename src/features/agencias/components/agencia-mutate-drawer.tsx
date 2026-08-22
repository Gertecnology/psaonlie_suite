import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAgenciaDialog } from '../store/use-agencia-dialog'
import {
  esEmpresa,
  type CrearAgenciaFormValues,
} from '../models/agencia.model'
import { useAgencia } from '../hooks/use-agencias'
import { useCrearAgencia } from '../hooks/use-crear-agencia'
import { useActualizarAgencia } from '../hooks/use-actualizar-agencia'
import { useActualizarLogoAgencia } from '../hooks/use-actualizar-logo-agencia'

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>

export function AgenciaMutateDrawer() {
  const { open, close, data: fila } = useAgenciaDialog()
  const crearAgencia = useCrearAgencia()
  const actualizarAgencia = useActualizarAgencia()
  const actualizarLogo = useActualizarLogoAgencia()

  const isUpdate = !!fila && !!fila.id
  const esHija = !!fila && !esEmpresa(fila)

  // El listado embebe las hijas con un DTO reducido que no trae
  // `heredaComision` ni su `porcentajeVentas` propio. Sin esos dos, el
  // formulario no puede decidir si el campo de comisión se edita o se muestra
  // heredado, así que la fila completa se pide al abrir el drawer sobre una hija.
  const detalleHija = useAgencia(fila?.id, open && esHija)
  const agencia = esHija && detalleHija.data ? detalleHija.data : fila

  const heredaComision = esHija && agencia?.heredaComision !== false
  const comisionHeredada = fila?.comisionDelPadre?.porcentajeVentas ?? null
  const cargandoHija = esHija && detalleHija.isLoading

  const isSubmitting =
    crearAgencia.isPending ||
    actualizarAgencia.isPending ||
    actualizarLogo.isPending

  // Estado para previsualización del logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(
      formSchema.superRefine((data, ctx) => {
        if (!isUpdate && (!data.password || data.password.length < 6)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La contraseña debe tener al menos 6 caracteres.',
            path: ['password'],
          })
        }
      }),
    ),
    defaultValues: {
      nombre: '',
      usuario: '',
      password: '',
      agenciaPrincipal: '',
      descripcion: '',
      url: '',
      activo: true,
      porcentajeVentas: undefined,
      profileImage: undefined,
    },
  })

  // `formState` es un Proxy: hay que leer `dirtyFields` durante el render para
  // que react-hook-form active su seguimiento.
  const { dirtyFields } = form.formState

  useEffect(() => {
    if (open) {
      if (isUpdate && agencia) {
        form.reset({
          nombre: agencia.nombre,
          usuario: agencia.usuario,
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
        setLogoPreview(agencia.imageUrl ?? null)
      } else {
        form.reset({
          nombre: '',
          usuario: '',
          password: '',
          agenciaPrincipal: '',
          descripcion: '',
          url: '',
          activo: true,
          porcentajeVentas: undefined,
          profileImage: undefined,
        })
        setLogoPreview(null)
      }
    }
  }, [open, isUpdate, agencia, form])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('profileImage', file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (isUpdate && agencia?.id) {
      const { password: _password, profileImage, ...updateData } = data

      // Una hija no tiene conexión propia: mandarle `url`, `usuario` o
      // `agenciaPrincipal` escribiría datos que el modelo dice que no existen
      // en ese nivel. Y su comisión, si la hereda, la manda el padre.
      const datosPermitidos = esHija
        ? {
            nombre: updateData.nombre,
            descripcion: updateData.descripcion,
            activo: updateData.activo,
            ...(heredaComision
              ? {}
              : {
                  porcentajeVentas:
                    updateData.porcentajeVentas?.toString() || null,
                }),
          }
        : {
            ...updateData,
            // Convertir porcentajeVentas a string para la actualización
            porcentajeVentas: updateData.porcentajeVentas?.toString() || null,
          }

      // Detección de cambios vía react-hook-form: comparar contra la agencia
      // con `!==` daba falsos positivos (la API devuelve "5.00" y el formulario
      // produce "5", así que porcentajeVentas siempre parecía modificado).
      // El logo se evalúa aparte porque `setValue` no lo marca como dirty.
      const hasDataChanges = Object.keys(dirtyFields).some(
        (key) => key !== 'profileImage' && key !== 'password',
      )

      const hasLogoChanged = !!profileImage
      const agenciaId = agencia.id

      // El drawer se cierra únicamente cuando la operación fue exitosa. Antes
      // se cerraba también en `onError`, lo que ocultaba los fallos ahora que
      // el backend los reporta de verdad.
      if (hasLogoChanged && hasDataChanges) {
        actualizarAgencia.mutate(
          { id: agenciaId, data: datosPermitidos },
          {
            onSuccess: () => {
              actualizarLogo.mutate(
                { id: agenciaId, profileImage: profileImage! },
                { onSuccess: () => close() },
              )
            },
          },
        )
      } else if (hasLogoChanged && !hasDataChanges) {
        actualizarLogo.mutate(
          { id: agenciaId, profileImage: profileImage! },
          { onSuccess: () => close() },
        )
      } else if (!hasLogoChanged && hasDataChanges) {
        actualizarAgencia.mutate(
          { id: agenciaId, data: datosPermitidos },
          { onSuccess: () => close() },
        )
      } else {
        close()
      }
    } else {
      const createData: CrearAgenciaFormValues = {
        ...data,
        password: data.password || '',
        url: data.url || undefined,
        profileImage: data.profileImage || undefined,
      }

      // Los toasts de éxito y error los emite `useCrearAgencia`, igual que en
      // update y delete. Acá sólo se cierra el drawer cuando la creación salió
      // bien; si falló, el formulario queda abierto con los datos cargados.
      crearAgencia.mutate(createData, {
        onSuccess: () => {
          close()
        },
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    // No dejamos cerrar mientras hay una petición en vuelo: el usuario no
    // sabría si se guardó o no.
    if (!open && !isSubmitting) {
      close()
    }
  }

  const titulo = esHija ? 'Agencia' : 'Empresa'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isUpdate ? 'Actualizar' : 'Crear'} {titulo}
          </SheetTitle>
          <SheetDescription>
            {esHija
              ? 'Las agencias las sincroniza el web service: su código, su stock y su conexión no se editan acá.'
              : isUpdate
                ? 'Actualiza la empresa con la información necesaria.'
                : 'Añade una nueva empresa con la información necesaria.'}{' '}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='agencia-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 px-4'
          >
            {/* Logo y nombre en la misma fila */}
            <div className='flex items-center gap-6 mb-2'>
              <div
                className='relative w-20 h-20 rounded-full border-2 border-accent bg-muted flex items-center justify-center cursor-pointer overflow-hidden group'
                onClick={() => fileInputRef.current?.click()}
                title='Seleccionar logo'
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={`Logo de la ${titulo.toLowerCase()}`}
                    className='object-cover w-full h-full rounded-full'
                  />
                ) : (
                  <span className='text-xs text-muted-foreground'>Logo</span>
                )}
                <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity'>
                  <span className='text-xs text-white'>Cambiar</span>
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleLogoChange}
                />
              </div>
              {/* Campo de nombre */}
              <div className='flex-1'>
                <FormField
                  control={form.control}
                  name='nombre'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Ingresa un nombre' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {esHija && agencia?.codigo && (
              <div className='rounded-lg border p-3 text-sm'>
                <span className='text-muted-foreground'>Código: </span>
                <span className='font-mono font-medium'>{agencia.codigo}</span>
              </div>
            )}

            {/* La conexión vive sólo en la empresa: una agencia que apuntara a
                otro servidor dejaría de ser una agencia. */}
            {!esHija && (
              <>
                <FormField
                  control={form.control}
                  name='usuario'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder='Ingresa un usuario'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isUpdate && (
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem className='space-y-1'>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            type='password'
                            placeholder='Ingresa una contraseña'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name='agenciaPrincipal'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Agencia Principal</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder='Ingresa una agencia principal'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name='descripcion'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Ingresa una descripción'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!esHija && (
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder='Ingresa una URL'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {heredaComision ? (
              /* La comisión heredada no se edita acá: se cambia en la empresa,
                 y editarla en los dos lugares es cómo dos cifras distintas
                 terminan cobrándose. `heredaComision` todavía no es escribible
                 por la API (`CreateAgenciaDto` no lo expone). */
              <FormItem className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <FormLabel>Porcentaje de ventas</FormLabel>
                  <Badge variant='secondary' className='text-xs'>
                    Heredada
                  </Badge>
                </div>
                <FormControl>
                  <Input
                    disabled
                    readOnly
                    aria-label='Porcentaje de ventas heredado'
                    value={comisionHeredada ?? ''}
                    placeholder={
                      cargandoHija ? 'Cargando...' : 'Sin porcentaje de ventas'
                    }
                  />
                </FormControl>
                <FormDescription>
                  Esta agencia cobra la comisión de su empresa. Para cambiarla,
                  editá la empresa.
                </FormDescription>
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name='porcentajeVentas'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Porcentaje de ventas</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='number'
                        step='0.01'
                        value={field.value ?? ''}
                        placeholder='Ingresa un porcentaje de ventas'
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='activo'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Indica si la {titulo.toLowerCase()} está activa.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline' disabled={isSubmitting}>
              Cerrar
            </Button>
          </SheetClose>
          <Button
            form='agencia-form'
            type='submit'
            disabled={isSubmitting || cargandoHija}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
