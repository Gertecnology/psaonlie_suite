interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className='bg-gradient-to-br from-[#4747F8] via-[#000066] to-[#4747F8] min-h-screen w-full flex items-center justify-center px-2'>
      <div className='w-full max-w-xs sm:w-[480px] mx-auto flex flex-col justify-center space-y-2 py-6 sm:py-10 md:py-12'>
        <div className='mb-4 flex items-center justify-center'>
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-jk7LpXOiFM0FqL2A0IR1k0vHJXmllm.png"
            alt="pasajeonline"
            className="h-10 w-auto sm:h-12 md:h-14 lg:h-16"
          />
        </div>
        {children}
      </div>
    </div>
  )
}
