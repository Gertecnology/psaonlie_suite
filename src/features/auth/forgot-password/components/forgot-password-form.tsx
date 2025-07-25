import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { forgotPassword } from '@/services/auth'

type ForgotFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Por favor ingresa tu correo' })
    .email({ message: 'Dirección de email inválida' }),
})

export function ForgotPasswordForm({ className, ...props }: ForgotFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await forgotPassword(data.email)
      setSuccess(true)
      form.reset()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al enviar el correo de recuperación')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 text-lg font-semibold">
          ¡Correo enviado exitosamente!
        </div>
        <p className="text-gray-600">
          Hemos enviado un enlace de recuperación a tu correo electrónico. 
          Por favor revisa tu bandeja de entrada.
        </p>
        <Button 
          onClick={() => {
            setSuccess(false)
            form.reset()
          }}
          className="bg-[#4747F8] hover:bg-blue-700 text-white font-semibold"
        >
          Enviar otro correo
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
        {error && (
          <div className="text-red-600 text-center text-sm font-medium mt-1 mb-2">{error}</div>
        )}
        <Button 
          className='mt-2 bg-[#FE0202] hover:bg-red-600 text-white font-semibold' 
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Continuar'}
        </Button>
      </form>
    </Form>
  )
}
