import Link from "next/link"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-blue-900">pasajeonline</span>
        </Link>
      </div>
    </header>
  )
}
