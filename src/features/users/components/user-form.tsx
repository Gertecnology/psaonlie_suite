import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { PageLayout } from '@/components/layout/page-layout'
import { PasswordInput } from '@/components/password-input'
import { useUserForm } from '../hooks/use-user-form'
import { UserPasswordForm } from './user-password-form'

/** Alto compartido por las dos tarjetas de arriba, de donde sale la simetría. */
const ALTO_DE_LA_FILA = 'lg:min-h-[480px]'

const ID_DEL_FORM = 'usuario-form'

interface UserFormProps {
  /** Absent when creating. */
  userId?: string
}

/**
 * Create or edit a user, on its own page.
 *
 * It was a modal up to 672px wide with nine fields, its own scrollbar, and a
 * second modal stacked on top of it for resetting the password. A modal has no
 * address: it cannot be linked, a reload loses it, and Escape throws away
 * everything typed so far.
 *
 * All the logic lives in `use-user-form`; this file only renders.
 */
export function UserForm({ userId }: UserFormProps) {
  const {
    form,
    save,
    saving,
    isEdit,
    roles,
    loadingRoles,
    esVendedor,
    loading,
    error,
    cargado,
    fotoPreview,
    errorFoto,
    elegirFoto,
    backToList,
    hasUnsavedChanges,
  } = useUserForm(userId)

  const entradaArchivo = React.useRef<HTMLInputElement | null>(null)
  const titulo = isEdit ? 'Editar usuario' : 'Nuevo usuario'

  // Un cierre accidental con el formulario a medias pierde todo lo cargado.
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hasUnsavedChanges])

  if (loading) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div className='max-w-2xl space-y-4'>
          <Skeleton className='h-20 w-20 rounded-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </PageLayout>
    )
  }

  /**
   * Un formulario en blanco no se distingue de uno cuyos datos están vacíos.
   *
   * Mientras `GET /api/usuarios/:id` no existió, la pantalla dibujaba los campos
   * sin nada adentro —sin correo, sin nombre, sin rol— y guardar desde ahí
   * escribía ese vacío encima de lo que la persona tenía. Que falle no puede
   * parecerse a que esté vacío.
   */
  if (error || !cargado) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el usuario</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {error?.message ??
              'El servidor no devolvió sus datos. No se muestra el formulario para no guardar campos vacíos encima de los suyos.'}
          </p>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/users'>Volver al listado</Link>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={titulo}
      description={
        isEdit
          ? 'Editando un usuario que ya existe.'
          : 'Los roles definen qué puede hacer la persona dentro del panel.'
      }
      showSearch={false}
      actions={
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/users'>
                <ArrowLeft className='mr-1.5 h-4 w-4' />
                Usuarios
              </Link>
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={backToList}
              disabled={saving}
            >
              Cancelar
            </Button>
            {/* Fuera del <form> pero atado por id: el botón vive arriba y
                sigue enviando. */}
            <Button type='submit' form={ID_DEL_FORM} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
          {hasUnsavedChanges && !saving && (
            <span className='text-muted-foreground text-xs'>
              Hay cambios sin guardar
            </span>
          )}
        </div>
      }
    >
      <Form {...form}>
        <form id={ID_DEL_FORM} onSubmit={save} className='space-y-5'>
          <div className='grid gap-5 lg:grid-cols-2'>
            <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
              <CardHeader>
                <CardTitle>Quién es</CardTitle>
                <CardDescription>Con el correo entra al panel.</CardDescription>
              </CardHeader>
              <CardContent className='flex-1 space-y-5'>
                <div className='space-y-2'>
                  <FormLabel>Foto</FormLabel>
                  <div className='flex items-center gap-4'>
                    {/* La foto sólo se puede cargar al crear: `PUT /api/usuarios/:id`
                        manda JSON y no acepta archivos, así que en edición el
                        selector prometía algo que nunca se guardaba. */}
                    {isEdit ? (
                      <div className='border-accent bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2'>
                        {fotoPreview ? (
                          <img
                            src={fotoPreview}
                            alt=''
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <span className='text-muted-foreground text-xs'>
                            Sin foto
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => entradaArchivo.current?.click()}
                        aria-label='Elegir la foto'
                        className='border-accent bg-muted focus-visible:ring-ring group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 focus-visible:ring-2 focus-visible:outline-none'
                      >
                        {fotoPreview ? (
                          <img
                            src={fotoPreview}
                            alt=''
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <ImagePlus className='text-muted-foreground h-5 w-5' />
                        )}
                        <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                          Cambiar
                        </span>
                      </button>
                    )}
                    <p className='text-muted-foreground text-sm'>
                      {isEdit
                        ? 'La foto sólo se carga al crear el usuario.'
                        : 'Opcional. Se ve en el menú del panel.'}
                    </p>
                  </div>
                  {!isEdit && (
                    <input
                      ref={entradaArchivo}
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      className='sr-only'
                      onChange={(evento) =>
                        elegirFoto(evento.target.files?.[0])
                      }
                    />
                  )}
                  {errorFoto && (
                    <p className='text-destructive text-xs'>{errorFoto}</p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          autoFocus={!isEdit}
                          placeholder='nombre@gertecnology.com'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='firstName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='lastName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
              <CardHeader>
                <CardTitle>Qué puede hacer</CardTitle>
                <CardDescription>
                  El rol define qué pantallas ve y qué puede tocar.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 space-y-5'>
                <FormField
                  control={form.control}
                  name='roleId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loadingRoles}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingRoles
                                  ? 'Cargando roles…'
                                  : 'Elegí un rol'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((rol) => (
                            <SelectItem key={rol.id} value={rol.id}>
                              {rol.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sólo quien vende cobra comisión, así que el campo aparece
                    recién cuando el rol elegido es el de vendedor. Ofrecerlo
                    para un administrador sería pedir un dato que nadie usa. */}
                {esVendedor && (
                  <FormField
                    control={form.control}
                    name='porcentajeComisionVenta'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comisión por venta</FormLabel>
                        <div className='relative'>
                          <FormControl>
                            <Input
                              {...field}
                              inputMode='decimal'
                              placeholder='0'
                              className='pr-8'
                            />
                          </FormControl>
                          <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm'>
                            %
                          </span>
                        </div>
                        <FormDescription>
                          Qué porcentaje de cada venta le queda. Sale del cargo
                          por servicio, no del precio del pasaje. En cero vende
                          igual, pero no cobra.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isEdit && (
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='confirmPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar</FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {isEdit && (
                  <>
                    <FormField
                      control={form.control}
                      name='isActive'
                      render={({ field }) => (
                        <FormItem className='flex items-start justify-between gap-6 rounded-md border p-4'>
                          <div className='space-y-1'>
                            <FormLabel>Puede entrar</FormLabel>
                            <FormDescription>
                              Apagado, no puede iniciar sesión. Sus ventas
                              quedan igual.
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

                    <FormField
                      control={form.control}
                      name='isVerified'
                      render={({ field }) => (
                        <FormItem className='flex items-start justify-between gap-6 rounded-md border p-4'>
                          <div className='space-y-1'>
                            <FormLabel>Correo verificado</FormLabel>
                            <FormDescription>
                              Se enciende solo cuando la persona confirma su
                              correo.
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* El cambio de contraseña va por su propio endpoint, así que vive
              fuera del formulario y tiene su propio botón. */}
          {isEdit && userId && (
            <Card>
              <CardHeader>
                <CardTitle>Cambiar la contraseña</CardTitle>
                <CardDescription>
                  Se guarda por separado, apenas la confirmás.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserPasswordForm userId={userId} />
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </PageLayout>
  )
}
