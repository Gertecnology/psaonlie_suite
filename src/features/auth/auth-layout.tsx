interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className='bg-background flex min-h-screen w-full items-center justify-center px-2'>
      <div className='mx-auto flex w-full max-w-xs flex-col justify-center space-y-2 py-6 sm:w-[480px] sm:py-10 md:py-12'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='border-border bg-sidebar rounded-xl border px-8 py-4'>
            <img
              src='/images/pasajeonline.svg'
              alt='Pasaje Online'
              className='h-8 w-auto sm:h-10'
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
