import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
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
import { verifyEmail } from '@/services/auth'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/api/auth/verify-email' })
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = search?.token

    if (!token) {
      setError('Token de verificación no proporcionado')
      setIsVerifying(false)
      return
    }

    const handleVerify = async () => {
      try {
        setIsVerifying(true)
        setError(null)
        const result = await verifyEmail(token)

        // 302 means successful verification (backend redirects)
        if (result.success && result.status === 302) {
          setIsSuccess(true)
          // Redirect to sign-in after a short delay
          setTimeout(() => {
            navigate({ to: '/sign-in' })
          }, 3000)
        } else {
          setIsSuccess(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al verificar el correo electrónico')
        setIsSuccess(false)
      } finally {
        setIsVerifying(false)
      }
    }

    handleVerify()
  }, [search?.token, navigate])

  return (
    <AuthLayout>
      <Card className='gap-4 border-[#4747F8] bg-white/95 shadow-2xl rounded-2xl'>
        <CardHeader className="flex flex-col items-center justify-center text-center pb-2 pt-6">
          <CardTitle className='text-2xl font-bold tracking-tight text-[#000066] mb-2'>
            Verificación de Correo
          </CardTitle>
          <CardDescription className="text-gray-600 text-base mb-2">
            {isVerifying && 'Verificando tu correo electrónico...'}
            {!isVerifying && isSuccess && 'Tu correo electrónico ha sido verificado exitosamente'}
            {!isVerifying && !isSuccess && error && 'Error en la verificación'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6 flex flex-col items-center justify-center min-h-[150px]">
          {isVerifying && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#4747F8]" />
              <p className="text-gray-600">Por favor espera...</p>
            </div>
          )}

          {!isVerifying && isSuccess && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-gray-700 font-medium">
                ¡Tu correo electrónico ha sido verificado correctamente!
              </p>
              <p className="text-gray-600 text-sm">
                Serás redirigido al inicio de sesión en unos momentos...
              </p>
            </div>
          )}

          {!isVerifying && !isSuccess && error && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-gray-700 font-medium text-center">{error}</p>
              <p className="text-gray-600 text-sm text-center">
                El token puede haber expirado o ser inválido.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!isVerifying && isSuccess && (
            <Button
              onClick={() => navigate({ to: '/sign-in' })}
              className="w-full bg-[#4747F8] hover:bg-[#000066]"
            >
              Ir al inicio de sesión
            </Button>
          )}
          {!isVerifying && !isSuccess && (
            <>
              <Button
                onClick={() => navigate({ to: '/sign-in' })}
                className="w-full bg-[#4747F8] hover:bg-[#000066]"
              >
                Ir al inicio de sesión
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Intentar nuevamente
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

