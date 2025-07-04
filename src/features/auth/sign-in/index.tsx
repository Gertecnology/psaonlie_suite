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
      <Card className='gap-4 border-[#4747F8] bg-white/95 shadow-2xl rounded-2xl'>
        <CardHeader className="flex flex-col items-center justify-center text-center pb-2 pt-6">
          <CardTitle className='text-2xl font-bold tracking-tight text-[#000066] mb-2'>Iniciar Sesión</CardTitle>
          <CardDescription className="text-gray-600 text-base mb-2">
            Ingresa tu correo y contraseña para <br />
            acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <UserAuthForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
