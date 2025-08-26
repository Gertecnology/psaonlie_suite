import { ArrowLeft, Building2, Globe, User, Lock, FileText, ExternalLink, Eye, EyeOff, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from '@tanstack/react-router'
import { CompanyStats } from './company-stats'
import { useState } from 'react'

interface Agencia {
  id: string
  nombre: string
  codigo: string
  boletosDisponibles: number
  ultimaSincronizacionSoap: string
  activo: boolean
}

interface CompanyDetailsHeaderProps {
  company?: {
    id?: string
    urlPerfil?: string | null
    nombre: string
    agenciaPrincipal?: string | null
    usuario?: string | null
    password?: string | null
    descripcion?: string | null
    url?: string | null
    activo?: boolean
    createdAt?: string
    updatedAt?: string
    porcentajeVentas?: string
    instruccionesPago?: string | null
    ventaHabilitada?: string
    ultimaSincronizacionSoap?: string
    agencias?: Agencia[]
  } | null
  loading?: boolean
}

export function CompanyDetailsHeader({ company, loading }: CompanyDetailsHeaderProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleGoBack = () => {
    navigate({ to: '/companies' })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Información de la empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Agencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Empresa no encontrada</h3>
        <p className="text-muted-foreground mb-4">La empresa que buscas no existe o ha sido eliminada.</p>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Empresas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver y acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={company.activo ? "default" : "secondary"}>
                {company.activo ? "Activa" : "Inactiva"}
              </Badge>
              {company.agenciaPrincipal && (
                <Badge variant="outline" className="text-xs">
                  {company.agenciaPrincipal}
                </Badge>
              )}
              {company.ventaHabilitada === "S" && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Venta Habilitada
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de la empresa */}
      <CompanyStats company={company} />

      {/* Información de la empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo y datos principales */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-xl border-2 border-accent bg-muted flex items-center justify-center overflow-hidden">
                {company.urlPerfil ? (
                  <img 
                    src={company.urlPerfil} 
                    alt={`Logo de ${company.nombre}`} 
                    className="object-cover w-full h-full rounded-xl" 
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <User className="h-4 w-4 inline mr-2" />
                    Usuario
                  </label>
                  <div className="text-sm font-medium">
                    {company.usuario || <span className="text-muted-foreground">No especificado</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Contraseña
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                      {showPassword ? company.password : '••••••••'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={togglePasswordVisibility}
                      className="h-6 w-6 p-0"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Porcentaje de Ventas
                  </label>
                  <div className="text-sm font-medium">
                    {company.porcentajeVentas ? `${company.porcentajeVentas}%` : <span className="text-muted-foreground">No especificado</span>}
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Sitio Web
                  </label>
                  <div className="text-sm">
                    {company.url ? (
                      <a 
                        href={company.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {company.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No especificado</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Agencia Principal
                  </label>
                  <div className="text-sm font-medium">
                    {company.agenciaPrincipal || <span className="text-muted-foreground">No especificada</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Última Sincronización SOAP
                  </label>
                  <div className="text-sm font-medium">
                    {company.ultimaSincronizacionSoap ? formatDate(company.ultimaSincronizacionSoap) : <span className="text-muted-foreground">No disponible</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {company.descripcion && (
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Descripción
              </label>
              <div className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {company.descripcion}
              </div>
            </div>
          )}

          {/* Instrucciones de Pago */}
          {company.instruccionesPago && (
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <CreditCard className="h-4 w-4 inline mr-2" />
                Instrucciones de Pago
              </label>
              <div className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {company.instruccionesPago}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Agencias */}
      {company.agencias && company.agencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agencias ({company.agencias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.agencias.map((agencia) => (
                <div key={agencia.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={agencia.activo ? "default" : "secondary"} className="text-xs">
                        {agencia.activo ? "Activa" : "Inactiva"}
                      </Badge>
                      <span className="font-medium">{agencia.nombre}</span>
                      <span className="text-sm text-muted-foreground">({agencia.codigo})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="text-right">
                      <div className="font-medium text-foreground">{agencia.boletosDisponibles.toLocaleString()}</div>
                      <div className="text-xs">Boletos disponibles</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{formatDate(agencia.ultimaSincronizacionSoap)}</div>
                      <div className="text-xs">Última sincronización</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 