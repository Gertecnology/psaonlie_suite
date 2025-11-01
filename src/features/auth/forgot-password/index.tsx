import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
          <Link to='/sign-in' className='w-full'>
            <Button 
              variant='outline' 
              className='w-full border-[#4747F8] text-[#4747F8] hover:bg-[#4747F8] hover:text-white'
            >
              Volver al inicio de sesión
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
