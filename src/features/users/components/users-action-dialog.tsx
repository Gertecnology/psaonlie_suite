'use client'

import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
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
import { useRoles, useCreateUser, useUpdateUser, useResetUserPassword } from '../hooks/use-users'
import { User } from '../models/user'

const formSchema = z
  .object({
    firstName: z.string().min(1, { message: 'El nombre es requerido.' }),
    lastName: z.string().min(1, { message: 'El apellido es requerido.' }),
    email: z
      .string()
      .min(1, { message: 'El email es requerido.' })
      .email({ message: 'El email no es válido.' }),
    password: z.string().transform((pwd) => pwd.trim()),
    roleIds: z.array(z.string()).optional(),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    profileImage: z.instanceof(File).optional(),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    isEdit: z.boolean(),
  })
  .superRefine(({ isEdit, password, confirmPassword }, ctx) => {
    // Solo validar contraseña para creación de usuarios
    if (!isEdit) {
      if (!password || password === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña es requerida.',
          path: ['password'],
        })
        return
      }

      if (password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña debe tener al menos 8 caracteres.',
          path: ['password'],
        })
      }

      if (!password.match(/[a-z]/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña debe contener al menos una letra minúscula.',
          path: ['password'],
        })
      }

      if (!password.match(/\d/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña debe contener al menos un número.',
          path: ['password'],
        })
      }

      if (password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Las contraseñas no coinciden.',
          path: ['confirmPassword'],
        })
      }
    }
  })
type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const { data: roles, isLoading: rolesLoading } = useRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const resetPassword = useResetUserPassword()
  
  // Estado para previsualización de la imagen de perfil
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Estado para el modal de resetear contraseña
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      roleIds: [],
      profileImage: undefined,
      isActive: true,
      isVerified: false,
      isEdit,
    },
  })

  useEffect(() => {
    if (open) {
      if (isEdit && currentRow) {
        form.reset({
          firstName: currentRow.firstName || '',
          lastName: currentRow.lastName || '',
          email: currentRow.email || '',
          password: '',
          confirmPassword: '',
          roleIds: currentRow.roles?.map(role => role.id) || [],
          profileImage: undefined,
          isActive: currentRow.isActive,
          isVerified: currentRow.isVerified,
          isEdit,
        })
        // Establecer el preview con la URL de la imagen de perfil
        setProfilePreview(currentRow.urlPerfil ?? null)
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          roleIds: [],
          profileImage: undefined,
          isActive: true,
          isVerified: false,
          isEdit,
        })
        setProfilePreview(null)
      }
    }
  }, [open, isEdit, currentRow, form])

  // Handler para seleccionar imagen de perfil
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('profileImage', file)
      
      // Crear preview para mostrar la imagen
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (values: UserForm) => {
    if (isEdit && currentRow?.id) {
      const { password, confirmPassword, profileImage, isEdit, ...updateData } = values
      
      updateUser.mutate(
        { 
          id: currentRow.id, 
          userData: updateData
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
            setProfilePreview(null)
          },
          onError: (error: unknown) => {
            import('sonner').then(({ toast }) => {
              let message = 'Ha ocurrido un error al actualizar el usuario.'
              if (error instanceof Error) {
                message = error.message
              } else if (typeof error === 'string') {
                message = error
              }
              toast.error('Error al actualizar', {
                description: message,
                duration: 3000,
              })
            })
          },
        }
      )
    } else {
      const { confirmPassword, isEdit, isActive, isVerified, ...createData } = values
      
      // Asegurar que roleIds no esté vacío
      const finalCreateData = {
        ...createData,
        roleIds: createData.roleIds && createData.roleIds.length > 0 ? createData.roleIds : undefined
      }
      
      createUser.mutate(finalCreateData, {
        onSuccess: (_user) => {
          onOpenChange(false)
          form.reset()
          setProfilePreview(null)
          import('sonner').then(({ toast }) => {
            toast.success('Usuario creado exitosamente', {
              description: 'El usuario ha sido creado. Revisa tu correo para verificar la cuenta.',
              duration: 5000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al crear el usuario.'
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
  }

  const handleResetPassword = () => {
    if (!currentRow?.id || !newPassword.trim()) return

    resetPassword.mutate(
      { id: currentRow.id, newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          setShowResetPassword(false)
          setNewPassword('')
          import('sonner').then(({ toast }) => {
            toast.success('Contraseña reseteada', {
              description: 'La contraseña ha sido reseteada exitosamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al resetear la contraseña.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al resetear', {
              description: message,
              duration: 3000,
            })
          })
        },
      }
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      setProfilePreview(null)
    }
    onOpenChange(open)
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isEdit ? 'Actualizar' : 'Crear'} Usuario
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Actualiza el usuario con la información necesaria.'
              : 'Añade un nuevo usuario con la información necesaria.'}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='user-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 px-4'
          >
            {/* Foto de perfil y email en la misma fila */}
            <div className='flex items-center gap-6 mb-2'>
              <div
                className='relative w-20 h-20 rounded-full border-2 border-accent bg-muted flex items-center justify-center cursor-pointer overflow-hidden group'
                onClick={() => fileInputRef.current?.click()}
                title='Seleccionar foto de perfil'
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt='Foto de perfil del usuario'
                    className='object-cover w-full h-full rounded-full'
                  />
                ) : (
                  <span className='text-xs text-muted-foreground'>Foto</span>
                )}
                <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity'>
                  <span className='text-xs text-white'>Cambiar</span>
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleProfileImageChange}
                />
              </div>
              {/* Campo de email */}
              <div className='flex-1'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Ingresa un email' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name='firstName'
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
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Ingresa un apellido' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='roleIds'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Rol</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value?.[0] || ''}
                    onValueChange={(value) => field.onChange([value])}
                    placeholder={rolesLoading ? 'Cargando roles...' : 'Seleccionar un rol'}
                    disabled={rolesLoading}
                    items={roles?.map((role) => ({
                      label: role.name,
                      value: role.id,
                    })) || []}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='ej., S3cur3P@ssw0rd'
                      {...field}
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
                <FormItem className='space-y-1'>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={!isPasswordTouched}
                      placeholder='ej., S3cur3P@ssw0rd'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit && (
              <>
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Activo</FormLabel>
                        <div className='text-sm text-muted-foreground'>
                          Indica si el usuario está activo.
                        </div>
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
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Verificado</FormLabel>
                        <div className='text-sm text-muted-foreground'>
                          Indica si el usuario está verificado.
                        </div>
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
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowResetPassword(true)}
                    className='text-orange-600 hover:text-orange-700'
                  >
                    Resetear Contraseña
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline' disabled={createUser.isPending || updateUser.isPending}>
              Cerrar
            </Button>
          </SheetClose>
          <Button 
            form='user-form' 
            type='submit'
            disabled={createUser.isPending || updateUser.isPending}
          >
            {createUser.isPending || updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
      
      {/* Modal para resetear contraseña */}
      {showResetPassword && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-background p-6 rounded-lg shadow-lg w-96'>
            <h3 className='text-lg font-semibold mb-4'>Resetear Contraseña</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Ingresa la nueva contraseña para {currentRow?.email}
            </p>
            <Input
              type='password'
              placeholder='Nueva contraseña'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='mb-4'
            />
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowResetPassword(false)
                  setNewPassword('')
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={!newPassword.trim() || resetPassword.isPending}
                className='bg-orange-600 hover:bg-orange-700'
              >
                {resetPassword.isPending ? 'Reseteando...' : 'Resetear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
