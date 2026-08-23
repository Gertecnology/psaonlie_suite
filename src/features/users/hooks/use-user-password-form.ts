import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useResetUserPassword } from './use-users'
import { validarPassword } from './use-user-form'

const schema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    for (const issue of validarPassword(values.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue,
        path: ['password'],
      })
    }

    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las contraseñas no coinciden.',
        path: ['confirmPassword'],
      })
    }
  })

export type UserPasswordFormFields = z.infer<typeof schema>

/**
 * Resetting another person's password, as its own form.
 *
 * It was a modal opened from inside another modal — two stacked overlays, the
 * top one holding a plain `<input type='text'>` with no validation, so the new
 * password was readable over the shoulder and could be a single character. Here
 * it is a section of the edit page with the same rules the creation form uses.
 */
export function useUserPasswordForm(userId: string) {
  const reset = useResetUserPassword()

  const form = useForm<UserPasswordFormFields>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const save = form.handleSubmit((values) => {
    reset.mutate(
      { id: userId, newPassword: values.password },
      // Se limpia sólo si el cambio salió bien: si falló, lo escrito sigue ahí
      // para reintentar.
      { onSuccess: () => form.reset({ password: '', confirmPassword: '' }) },
    )
  })

  return { form, save, saving: reset.isPending }
}
