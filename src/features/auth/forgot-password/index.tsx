import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Recuperar contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>

        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
