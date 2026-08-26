import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useRoles, useUser, useCreateUser, useUpdateUser } from './use-users'

/**
 * Everything the user form does that is not rendering.
 *
 * It used to live inside a 553-line modal that also carried a second modal for
 * resetting passwords, two copies of the empty values and a boolean field
 * (`isEdit`) smuggled into the schema so the validation could tell the two
 * modes apart. Out here, what each mode actually writes is legible.
 */
const schema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido.')
    .email('El email no es válido.'),
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  // Un solo rol: la API recibe una lista, pero el panel siempre asignó uno y el
  // selector no permite más. Guardar el arreglo acá sólo servía para tener que
  // desarmarlo en cada lectura.
  roleId: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  profileImage: z.instanceof(File).optional(),
})

export type UserFormFields = z.infer<typeof schema>

const EMPTY: UserFormFields = {
  email: '',
  firstName: '',
  lastName: '',
  roleId: '',
  password: '',
  confirmPassword: '',
  isActive: true,
  isVerified: false,
  profileImage: undefined,
}

/** Images the backend accepts, and a ceiling it will reject anyway. */
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const TAMANO_MAXIMO_FOTO = 2 * 1024 * 1024

/**
 * @param userId - Absent when creating.
 */
export function useUserForm(userId?: string) {
  const navigate = useNavigate()
  const isEdit = Boolean(userId)

  const userQuery = useUser(userId ?? '')
  const user = userQuery.data

  const rolesQuery = useRoles()

  const create = useCreateUser()
  const update = useUpdateUser()

  const [fotoPreview, setFotoPreview] = React.useState<string | null>(null)
  const [errorFoto, setErrorFoto] = React.useState<string | null>(null)

  const form = useForm<UserFormFields>({
    resolver: zodResolver(
      /**
       * The password rules only exist while creating.
       *
       * `PUT /api/usuarios/:id` does not accept a password at all — that is
       * what the reset endpoint is for — so demanding one on edit would block a
       * save the API was never going to reject.
       */
      schema.superRefine((values, ctx) => {
        if (isEdit) return

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
      }),
    ),
    defaultValues: EMPTY,
  })

  /**
   * The form is filled once, when the record first arrives — never again.
   *
   * The modal had the user object among its effect's dependencies, and that
   * object is new on every refetch, so any background refresh called
   * `form.reset()` and **wiped whatever was being typed**. Keying on the id
   * means a refetch of the same user changes nothing on screen.
   */
  const loadedId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!user || loadedId.current === user.id) return

    loadedId.current = user.id
    form.reset({
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      roleId: user.roles?.[0]?.id ?? '',
      // Nunca se precarga: la API no la devuelve y mostrar algo sería mentir.
      password: '',
      confirmPassword: '',
      isActive: user.isActive,
      isVerified: user.isVerified,
      profileImage: undefined,
    })
    setFotoPreview(user.urlPerfil ?? null)
  }, [user, form])

  const elegirFoto = React.useCallback(
    (archivo: File | undefined) => {
      setErrorFoto(null)
      if (!archivo) return

      // Se valida acá y no al guardar: enterarse de que el archivo no servía
      // después de completar el formulario entero es la peor versión de este
      // error.
      if (!TIPOS_IMAGEN.includes(archivo.type)) {
        setErrorFoto('La foto tiene que ser una imagen JPG, PNG, WEBP o SVG.')
        return
      }
      if (archivo.size > TAMANO_MAXIMO_FOTO) {
        setErrorFoto('La foto no puede pesar más de 2 MB.')
        return
      }

      form.setValue('profileImage', archivo, { shouldDirty: true })

      const lector = new FileReader()
      lector.onloadend = () => setFotoPreview(lector.result as string)
      lector.readAsDataURL(archivo)
    },
    [form],
  )

  const backToList = React.useCallback(() => {
    void navigate({ to: '/users' })
  }, [navigate])

  const save = form.handleSubmit((values) => {
    // Sólo se navega si la operación salió bien: si falla, el formulario se
    // queda con todo lo cargado y el error a la vista.
    if (isEdit && userId) {
      update.mutate(
        {
          id: userId,
          userData: {
            firstName: values.firstName,
            lastName: values.lastName,
            roleIds: values.roleId ? [values.roleId] : undefined,
            isActive: values.isActive,
            isVerified: values.isVerified,
          },
        },
        { onSuccess: backToList },
      )
      return
    }

    create.mutate(
      {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        roleIds: values.roleId ? [values.roleId] : undefined,
        profileImage: values.profileImage,
      },
      { onSuccess: backToList },
    )
  })

  return {
    form,
    save,
    saving: create.isPending || update.isPending,
    isEdit,
    roles: rolesQuery.data ?? [],
    loadingRoles: rolesQuery.isLoading,
    loading: isEdit && userQuery.isLoading,
    error: userQuery.error,
    fotoPreview,
    errorFoto,
    elegirFoto,
    backToList,
    hasUnsavedChanges: form.formState.isDirty,
  }
}

/**
 * The rules the backend enforces on a new password, in the order a person
 * would fix them.
 *
 * Shared with the reset form so both places demand the same thing: the modal
 * used to check eight characters, a lowercase letter and a digit when creating,
 * and absolutely nothing when resetting — the one path an admin uses on someone
 * else's account.
 */
export function validarPassword(password: string): string[] {
  const problemas: string[] = []

  if (!password) return ['La contraseña es requerida.']
  if (password.length < 8) {
    problemas.push('La contraseña debe tener al menos 8 caracteres.')
  }
  if (!/[a-z]/.test(password)) {
    problemas.push('La contraseña debe contener al menos una letra minúscula.')
  }
  if (!/\d/.test(password)) {
    problemas.push('La contraseña debe contener al menos un número.')
  }

  return problemas
}
