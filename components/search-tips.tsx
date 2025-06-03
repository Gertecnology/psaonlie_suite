import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, Clock, CreditCard, Shield } from "lucide-react"

const tips = [
  {
    icon: Clock,
    title: "Reserva con anticipación",
    description: "Los mejores precios están disponibles hasta 30 días antes del viaje",
    color: "text-blue-600",
  },
  {
    icon: CreditCard,
    title: "Compara precios",
    description: "Encuentra las mejores ofertas entre más de 50 empresas de transporte",
    color: "text-green-600",
  },
  {
    icon: Shield,
    title: "Viaja seguro",
    description: "Todas nuestras empresas cumplen con los más altos estándares de seguridad",
    color: "text-purple-600",
  },
]

export function SearchTips() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">Tips para tu viaje</h2>
          </div>
          <p className="text-lg text-gray-600">Consejos para que tengas la mejor experiencia de viaje</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tips.map((tip, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className={`inline-flex p-3 rounded-full bg-gray-100 mb-6`}>
                  <tip.icon className={`h-8 w-8 ${tip.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{tip.title}</h3>
                <p className="text-gray-600">{tip.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
