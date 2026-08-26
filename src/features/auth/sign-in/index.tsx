import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader className='flex flex-col items-center justify-center pt-6 pb-2 text-center'>
          <CardTitle className='mb-2 text-2xl font-bold tracking-tight'>
            Iniciar Sesión
          </CardTitle>
          <CardDescription className='mb-2 text-base'>
            Ingresa tu correo y contraseña para <br />
            acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-0 pb-6'>
          <UserAuthForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
