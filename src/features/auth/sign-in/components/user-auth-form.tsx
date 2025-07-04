import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
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
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useAuth } from '@/context/auth-context'

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Por favor ingresa tu correo' })
    .email({ message: 'Dirección de email inválida' }),
  password: z
    .string()
    .min(1, {
      message: 'Por favor ingresa tu contraseña',
    })
    .min(7, {
      message: 'La contraseña debe tener al menos 7 caracteres',
    }),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      await login(data.email, data.password)
      navigate({ to: '/' })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al iniciar sesión')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#000066] font-semibold">Correo electrónico</FormLabel>
              <FormControl>
                <Input 
                  placeholder='nombre@ejemplo.com' 
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
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel className="text-[#000066] font-semibold">Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  {...field} 
                  className="border-[#4747F8] focus:border-[#4747F8] focus:ring-[#4747F8] text-gray-900"
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-[#4747F8] absolute -top-0.5 right-0 text-sm font-medium hover:opacity-75'
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </FormItem>
          )}
        />
        {error && (
          <div className="text-red-600 text-center text-sm font-medium mt-1 mb-2">{error}</div>
        )}
        <Button 
          className='mt-2 bg-[#FE0202] hover:bg-red-600 text-white font-semibold' 
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>
    </Form>
  )
}
