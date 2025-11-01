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
      <Card className='gap-4 border-[#4747F8] bg-white/95 shadow-2xl rounded-2xl'>
        <CardHeader className="flex flex-col items-center justify-center text-center pb-2 pt-6">
          <CardTitle className='text-2xl font-bold tracking-tight text-[#000066] mb-2'>
            Restablecer Contraseña
          </CardTitle>
          <CardDescription className="text-gray-600 text-base mb-2">
            Ingresa tu nueva contraseña para restablecer tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

