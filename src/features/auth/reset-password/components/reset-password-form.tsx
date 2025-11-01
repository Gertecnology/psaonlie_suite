import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
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
import { resetPassword } from '@/services/auth'
import { CheckCircle2, XCircle } from 'lucide-react'

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

export function ResetPasswordForm({ className, ...props }: ResetPasswordFormProps) {
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
      <div className="flex flex-col items-center gap-4 py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div className="text-center space-y-2">
          <div className="text-green-600 text-lg font-semibold">
            ¡Contraseña actualizada exitosamente!
          </div>
          <p className="text-gray-600 text-sm">
            Serás redirigido al inicio de sesión en unos momentos...
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: '/sign-in' })}
          className="w-full bg-[#4747F8] hover:bg-[#000066]"
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
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-600 text-sm">
                El enlace de restablecimiento puede haber expirado o ser inválido.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: '/sign-in' })}
              className="w-full bg-[#4747F8] hover:bg-[#000066]"
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
                  <FormLabel className="text-[#000066] font-semibold">Nueva Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder='Ingresa tu nueva contraseña' 
                      {...field} 
                      className="border-[#4747F8] focus:border-[#4747F8] focus:ring-[#4747F8] text-gray-900"
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
                  <FormLabel className="text-[#000066] font-semibold">Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder='Confirma tu nueva contraseña' 
                      {...field} 
                      className="border-[#4747F8] focus:border-[#4747F8] focus:ring-[#4747F8] text-gray-900"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="text-red-600 text-center text-sm font-medium mt-1 mb-2">{error}</div>
            )}
            <Button 
              className='mt-2 bg-[#FE0202] hover:bg-red-600 text-white font-semibold' 
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

