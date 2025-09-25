'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useRoles } from '../hooks/use-users'
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
    isEdit: z.boolean(),
  })
  .superRefine(({ isEdit, password, confirmPassword }, ctx) => {
    if (!isEdit || (isEdit && password !== '')) {
      if (password === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña es requerida.',
          path: ['password'],
        })
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
  
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          firstName: currentRow?.firstName || '',
          lastName: currentRow?.lastName || '',
          email: currentRow?.email || '',
          password: '',
          confirmPassword: '',
          roleIds: currentRow?.roles?.map(role => role.id) || [],
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          roleIds: [],
          isEdit,
        },
  })

  const onSubmit = (values: UserForm) => {
    form.reset()
    showSubmittedData(values)
    onOpenChange(false)
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Actualiza la información del usuario aquí. ' : 'Crea un nuevo usuario aquí. '}
            Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Juan'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Apellido
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Pérez'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='juan.perez@gmail.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleIds'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Roles
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value?.[0] || ''}
                      onValueChange={(value) => field.onChange([value])}
                      placeholder={rolesLoading ? 'Cargando roles...' : 'Seleccionar un rol'}
                      disabled={rolesLoading}
                      className='col-span-4'
                      items={roles?.map((role) => ({
                        label: role.name,
                        value: role.id,
                      })) || []}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='ej., S3cur3P@ssw0rd'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Confirmar Contraseña
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder='ej., S3cur3P@ssw0rd'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
