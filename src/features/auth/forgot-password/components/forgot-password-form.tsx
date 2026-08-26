import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPassword } from '@/services/auth'
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
      <div className='space-y-4 text-center'>
        <div className='text-estado-ok text-lg font-semibold'>
          ¡Correo enviado exitosamente!
        </div>
        <p className='text-muted-foreground'>
          Hemos enviado un enlace de recuperación a tu correo electrónico. Por
          favor revisa tu bandeja de entrada.
        </p>
        <Button
          onClick={() => {
            setSuccess(false)
            form.reset()
          }}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
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
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input placeholder='nombre@ejemplo.com' {...field} />
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
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Continuar'}
        </Button>
      </form>
    </Form>
  )
}
