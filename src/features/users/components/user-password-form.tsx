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
import { useUserPasswordForm } from '../hooks/use-user-password-form'

interface UserPasswordFormProps {
  userId: string
}

/**
 * The reset-password section of the edit page.
 *
 * All the logic lives in `use-user-password-form`; this file only renders.
 */
export function UserPasswordForm({ userId }: UserPasswordFormProps) {
  const { form, save, saving } = useUserPasswordForm(userId)

  return (
    <Form {...form}>
      <form onSubmit={save} className='space-y-4 rounded-md border p-4'>
        <div>
          <h2 className='text-sm font-medium'>Restablecer contraseña</h2>
          <p className='text-muted-foreground text-sm'>
            La contraseña nueva reemplaza a la anterior de inmediato. Avisale a
            la persona por otro medio.
          </p>
        </div>

        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña nueva</FormLabel>
              <FormControl>
                {/* Enmascarada, con el ojito para revelarla: antes era un
                    `<input type='text'>` y quedaba a la vista de cualquiera
                    que pasara por atrás. */}
                <PasswordInput {...field} autoComplete='new-password' />
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
              <FormLabel>Confirmar contraseña nueva</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete='new-password' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' variant='outline' disabled={saving}>
          {saving ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>
    </Form>
  )
}
