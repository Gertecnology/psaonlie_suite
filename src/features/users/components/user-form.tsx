import * as React from 'react'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { PasswordInput } from '@/components/password-input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useUserForm } from '../hooks/use-user-form'
import { UserPasswordForm } from './user-password-form'

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
    loading,
    error,
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

  if (error) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el usuario</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
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
      description='Los roles definen qué puede hacer la persona dentro del panel.'
      showSearch={false}
      actions={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/users'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Usuarios
          </Link>
        </Button>
      }
    >
      <div className='max-w-2xl space-y-8'>
        <Form {...form}>
          {/* El submit vive en el <form>, así que Enter guarda desde cualquier
              campo — antes el botón estaba en el pie del modal. */}
          <form onSubmit={save} className='space-y-6'>
            <div className='flex items-start gap-6'>
              <div className='space-y-2'>
                {/* La foto sólo se puede cargar al crear: `PUT /api/usuarios/:id`
                    manda JSON y no acepta archivos, así que en edición el
                    selector prometía algo que nunca se guardaba. */}
                {isEdit ? (
                  <div className='border-accent bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2'>
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt=''
                        className='h-full w-full rounded-full object-cover'
                      />
                    ) : (
                      <span className='text-muted-foreground text-xs'>
                        Sin foto
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Es un <button> y no un <div onClick>: así se llega con
                        Tab y se activa con Enter. */}
                    <button
                      type='button'
                      onClick={() => entradaArchivo.current?.click()}
                      aria-label='Elegir la foto de perfil'
                      className='border-accent bg-muted focus-visible:ring-ring group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 focus-visible:ring-2 focus-visible:outline-none'
                    >
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt=''
                          className='h-full w-full rounded-full object-cover'
                        />
                      ) : (
                        <ImagePlus className='text-muted-foreground h-6 w-6' />
                      )}
                      <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                        Cambiar
                      </span>
                    </button>
                    <input
                      ref={entradaArchivo}
                      type='file'
                      accept='image/jpeg,image/png,image/webp,image/svg+xml'
                      className='sr-only'
                      onChange={(evento) =>
                        elegirFoto(evento.target.files?.[0])
                      }
                    />
                    {errorFoto && (
                      <p className='text-destructive max-w-[10rem] text-xs'>
                        {errorFoto}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className='flex-1'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          autoFocus={!isEdit}
                          // El endpoint de actualización no acepta el email, así
                          // que en edición se muestra pero no se edita.
                          disabled={isEdit}
                          autoComplete='email'
                          placeholder='juan.perez@ejemplo.com'
                        />
                      </FormControl>
                      {isEdit && (
                        <FormDescription>
                          El email identifica la cuenta y no se puede cambiar.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus={isEdit} placeholder='Juan' />
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
                      <Input {...field} placeholder='Pérez' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='roleId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  {/* `value` y no `defaultValue`: los roles llegan por red
                      después del primer render, y un Select no controlado se
                      quedaba vacío aunque el usuario ya tuviera rol. */}
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingRoles}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={
                            loadingRoles ? 'Cargando roles…' : 'Elegí un rol'
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

            {/* Sólo al crear: la API no devuelve la contraseña ni la acepta en
                la actualización. Para cambiarla está la sección de abajo. */}
            {!isEdit && (
              <fieldset className='space-y-4 rounded-md border p-4'>
                <legend className='px-1 text-sm font-medium'>Contraseña</legend>

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          autoComplete='new-password'
                          placeholder='ej.: S3cur3P@ssw0rd'
                        />
                      </FormControl>
                      <FormDescription>
                        Mínimo 8 caracteres, con una minúscula y un número.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          autoComplete='new-password'
                          placeholder='Repetí la contraseña'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
            )}

            {isEdit && (
              <>
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Activo</FormLabel>
                        <FormDescription>
                          Un usuario inactivo no puede entrar al panel.
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
                    <FormItem className='flex items-center justify-between rounded-md border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Verificado</FormLabel>
                        <FormDescription>
                          Marcalo si ya confirmó su email por otro medio.
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

            <div className='flex items-center gap-3 border-t pt-4'>
              <Button type='submit' disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                onClick={backToList}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>

        {/* Un <form> hermano y no anidado: el HTML no permite un formulario
            dentro de otro, y cambiar la contraseña es una operación aparte con
            su propio endpoint. */}
        {isEdit && userId && <UserPasswordForm userId={userId} />}
      </div>
    </PageLayout>
  )
}
