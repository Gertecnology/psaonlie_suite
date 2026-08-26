import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { resetPassword } from '@/services/auth'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'

type ResetPasswordFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, {
        message: 'Por favor ingresa tu nueva contraseña',
      })
      .min(7, {
        message: 'La contraseña debe tener al menos 7 caracteres',
      }),
    confirmPassword: z.string().min(1, {
      message: 'Por favor confirma tu contraseña',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export function ResetPasswordForm({
  className,
  ...props
}: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/reset-password' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    const tokenFromUrl = search?.token
    if (!tokenFromUrl) {
      setError('Token de restablecimiento no proporcionado')
      setIsLoading(false)
    } else {
      setToken(tokenFromUrl)
    }
  }, [search?.token])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) {
      setError('Token de restablecimiento no válido')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await resetPassword(token, data.newPassword)
      setSuccess(true)
      // Redirect to sign-in after a short delay
      setTimeout(() => {
        navigate({ to: '/sign-in' })
      }, 2000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al restablecer la contraseña')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className='flex flex-col items-center gap-4 py-4'>
        <CheckCircle2 className='text-estado-ok h-12 w-12' />
        <div className='space-y-2 text-center'>
          <div className='text-estado-ok text-lg font-semibold'>
            ¡Contraseña actualizada exitosamente!
          </div>
          <p className='text-muted-foreground text-sm'>
            Serás redirigido al inicio de sesión en unos momentos...
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: '/sign-in' })}
          className='bg-primary text-primary-foreground hover:bg-primary/90 w-full'
        >
          Ir al inicio de sesión
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {!token && error && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <XCircle className='text-destructive h-12 w-12' />
            <div className='space-y-2 text-center'>
              <p className='text-destructive font-medium'>{error}</p>
              <p className='text-muted-foreground text-sm'>
                El enlace de restablecimiento puede haber expirado o ser
                inválido.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: '/sign-in' })}
              className='bg-primary text-primary-foreground hover:bg-primary/90 w-full'
            >
              Volver al inicio de sesión
            </Button>
          </div>
        )}

        {token && (
          <>
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Ingresa tu nueva contraseña'
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
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Confirma tu nueva contraseña'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className='text-destructive mt-1 mb-2 text-center text-sm font-medium'>
                {error}
              </div>
            )}
            <Button
              className='bg-primary text-primary-foreground hover:bg-primary/90 mt-2'
              disabled={isLoading || !token}
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}
