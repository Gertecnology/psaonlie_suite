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

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  usuario: z.string().nullable().optional(),
  password: z.string().optional(),
  agenciaPrincipal: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  urlPerfil: z.string().nullable().optional(),
  activo: z.boolean(),
  porcentajeVentas: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function CompanyMutateDrawer() {
  const { open, close, data: company } = useCompanyDialog()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()

  const isUpdate = !!company && !!company.id

  // Estado para previsualización del logo
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.urlPerfil ?? null)
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
      urlPerfil: '',
      activo: true,
      porcentajeVentas: '',
    },
  })

  useEffect(() => {
    if (isUpdate && company) {
      form.reset(company)
      setLogoPreview(company.urlPerfil ?? null)
    } else {
      form.reset({
        nombre: '',
        usuario: '',
        password: '',
        agenciaPrincipal: '',
        descripcion: '',
        url: '',
        urlPerfil: '',
        activo: true,
        porcentajeVentas: '',
      })
      setLogoPreview(null)
    }
  }, [open, isUpdate, company, form])

  // Handler para seleccionar imagen y convertir a base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        form.setValue('urlPerfil', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (isUpdate && company?.id) {
      const { password, ...updateData } = data
      updateCompany.mutate({ id: company.id, data: updateData })
    } else {
      createCompany.mutate(data as CreateCompanyFormValues, {
        onSuccess: () => {
          // toast de éxito con duración
          import('sonner').then(({ toast }) => {
            toast.success('Empresa creada', {
              description: 'La empresa se ha creado correctamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al crear la empresa.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al crear', {
              description: message,
              duration: 3000,
            })
          })
        },
      })
    }
    close()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col'>
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
              {/* Campo oculto para urlPerfil */}
              <input type='hidden' {...form.register('urlPerfil')} />
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
                      value={field.value ?? ''}
                      placeholder='Ingresa un porcentaje de ventas'
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
            <Button variant='outline'>Cerrar</Button>
          </SheetClose>
          <Button form='company-form' type='submit'>
            Guardar cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
