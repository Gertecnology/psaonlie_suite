'use client'

import React from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/features/companies/components/data-table'
import { companyColumns } from '@/features/companies/components/columns'
import { useGetCompanies } from '@/features/companies/hooks/use-get-companies'
import { CompanyMutateDrawer } from '@/features/companies/components/company-mutate-drawer'
import { CompanyDialogs } from '@/features/companies/components/company-dialogs'
import { CompanyPrimaryButtons } from '@/features/companies/components/company-primary-buttons'
import { Skeleton } from '@/components/ui/skeleton'

export default function CompaniesPage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading } = useGetCompanies(
    pagination.pageIndex + 1,
    pagination.pageSize,
  )

  if (isLoading) return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <Skeleton className='h-8 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='overflow-x-auto'>
        <div className='min-w-full border rounded-md bg-background'>
          {/* Header skeleton */}
          <div className='grid grid-cols-8 gap-4 px-2 py-3 border-b'>
            <Skeleton className='h-5 w-5 rounded' />
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-5 w-8 rounded-full justify-self-end' />
          </div>
          {/* Filas skeleton */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className='grid grid-cols-8 gap-4 px-2 py-3 border-b last:border-b-0'>
              <Skeleton className='h-5 w-5 rounded' />
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-5 w-20' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-8 w-8 rounded-full justify-self-end' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Empresas</h2>
            <p className='text-muted-foreground'>
              Gestiona las empresas de transporte.
            </p>
          </div>
          <CompanyPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {data && (
            <DataTable
              columns={companyColumns}
              data={data.items}
              pageCount={data.totalPages}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          )}
        </div>
      </Main>

      <CompanyMutateDrawer />
      <CompanyDialogs />
    </>
  )
} 