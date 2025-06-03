import Link from "next/link"
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y copyright */}
          <div className="space-y-4">
            <div>
              <span className="text-2xl font-bold">pasajeonline</span>
              <p className="text-sm text-blue-200 mt-4">pasajeonline © 2025 | Todos los derechos reservados.</p>
            </div>
          </div>

          {/* Sobre pasajeonline */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre pasajeonline</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Preguntas Frecuentes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Preguntas Frecuentes</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Empresas de Transporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Términos y Condiciones */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Términos y Condiciones</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Alianzas
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="mt-8 pt-8 border-t border-blue-800">
          <div className="flex justify-end space-x-4">
            <Link
              href="#"
              className="bg-white text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="bg-white text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="bg-white text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="bg-white text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
