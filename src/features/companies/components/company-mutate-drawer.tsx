import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useCompanyDialog } from '../store/use-company-dialog'
import { type CreateCompanyFormValues } from '../models/company.model'
import { useCreateCompany } from '../hooks/use-create-company'
import { useUpdateCompany } from '../hooks/use-update-company'
import { useUpdateCompanyLogo } from '../hooks/use-update-company-logo'

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

export function CompanyMutateDrawer() {
  const { open, close, data: company } = useCompanyDialog()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const updateCompanyLogo = useUpdateCompanyLogo()

  const isUpdate = !!company && !!company.id

  const isSubmitting =
    createCompany.isPending ||
    updateCompany.isPending ||
    updateCompanyLogo.isPending

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
      if (isUpdate && company) {
        form.reset({
          nombre: company.nombre,
          usuario: company.usuario,
          password: '',
          agenciaPrincipal: company.agenciaPrincipal,
          descripcion: company.descripcion,
          url: company.url,
          activo: company.activo,
          porcentajeVentas: company.porcentajeVentas ? parseFloat(company.porcentajeVentas) : undefined,
          profileImage: undefined,
        })
        // Establecer el logo preview con la URL de la imagen de la empresa
        setLogoPreview(company.imageUrl ?? null)
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
  }, [open, isUpdate, company, form])

  // Handler para seleccionar imagen
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('profileImage', file)
      
      // Crear preview para mostrar la imagen
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (isUpdate && company?.id) {
      const { password, profileImage, ...updateData } = data
      // Convertir porcentajeVentas a string para la actualización
      const updateDataWithStringPercent = {
        ...updateData,
        porcentajeVentas: updateData.porcentajeVentas?.toString() || null,
      }

      // Detección de cambios vía react-hook-form: comparar contra la empresa
      // con `!==` daba falsos positivos (la API devuelve "5.00" y el formulario
      // produce "5", así que porcentajeVentas siempre parecía modificado).
      // El logo se evalúa aparte porque `setValue` no lo marca como dirty.
      const hasDataChanges = Object.keys(dirtyFields).some(
        (key) => key !== 'profileImage' && key !== 'password',
      )

      // Verificar si se cambió el logo
      const hasLogoChanged = !!profileImage

      // El drawer se cierra únicamente cuando la operación fue exitosa. Antes
      // se cerraba también en `onError`, lo que ocultaba los fallos ahora que
      // el backend los reporta de verdad.
      if (hasLogoChanged && hasDataChanges) {
        // Caso 1: Se cambió tanto el logo como los datos - hacer 2 peticiones
        updateCompany.mutate(
          { id: company.id, data: updateDataWithStringPercent },
          {
            onSuccess: () => {
              // Después de actualizar los datos, actualizar el logo
              updateCompanyLogo.mutate(
                { id: company.id, profileImage: profileImage! },
                {
                  onSuccess: () => {
                    close()
                  },
                },
              )
            },
          },
        )
      } else if (hasLogoChanged && !hasDataChanges) {
        // Caso 2: Solo se cambió el logo - hacer 1 petición
        updateCompanyLogo.mutate(
          { id: company.id, profileImage: profileImage! },
          {
            onSuccess: () => {
              close()
            },
          },
        )
      } else if (!hasLogoChanged && hasDataChanges) {
        // Caso 3: Solo se cambiaron los datos - hacer 1 petición
        updateCompany.mutate(
          { id: company.id, data: updateDataWithStringPercent },
          {
            onSuccess: () => {
              close()
            },
          },
        )
      } else {
        // Caso 4: No hay cambios - solo cerrar
        close()
      }
    } else {
      // Para creación, incluir el archivo si existe
      const createData: CreateCompanyFormValues = {
        ...data,
        password: data.password || '',
        url: data.url || undefined,
        profileImage: data.profileImage || undefined,
      }
      
      // Los toasts de éxito y error los emite `useCreateCompany`, igual que en
      // update y delete. Acá sólo se cierra el drawer cuando la creación salió
      // bien; si falló, el formulario queda abierto con los datos cargados.
      createCompany.mutate(createData, {
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isUpdate ? 'Actualizar' : 'Crear'} Empresa
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Actualiza la empresa con la información necesaria.'
              : 'Añade una nueva empresa con la información necesaria.'}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='company-form'
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
                    alt='Logo de la empresa'
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
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='activo'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Indica si la empresa está activa.
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
            form='company-form'
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
