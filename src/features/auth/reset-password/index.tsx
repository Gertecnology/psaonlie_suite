import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { ResetPasswordForm } from './components/reset-password-form'

export default function ResetPassword() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader className='flex flex-col items-center justify-center pt-6 pb-2 text-center'>
          <CardTitle className='mb-2 text-2xl font-bold tracking-tight'>
            Restablecer Contraseña
          </CardTitle>
          <CardDescription className='mb-2 text-base'>
            Ingresa tu nueva contraseña para restablecer tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </AuthLayout>
  )
}
