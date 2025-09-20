import { PageLayout } from '@/components/layout/page-layout'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { useUsersFilters, useUsers } from './hooks/use-users'

export default function Users() {
  const { filters, updateFilter } = useUsersFilters()
  const { data: usersData, isLoading, error } = useUsers(filters)

  const handlePageChange = (page: number) => {
    updateFilter('page', page)
  }

  const handleLimitChange = (limit: number) => {
    updateFilter('limit', limit)
  }

  if (error) {
    return (
      <PageLayout
        title="Lista de Usuarios"
        description="Gestiona tus usuarios y sus roles aquí."
        actions={<UsersPrimaryButtons />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error al cargar usuarios</h3>
            <p className="text-muted-foreground mt-2">
              No se pudieron cargar los usuarios. Por favor, intenta nuevamente.
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <UsersProvider>
      <PageLayout
        title="Lista de Usuarios"
        description="Gestiona tus usuarios y sus roles aquí."
        actions={<UsersPrimaryButtons />}
      >
        <UsersTable 
          data={usersData?.data || []} 
          columns={columns}
          isLoading={isLoading}
          pagination={{
            total: usersData?.total || 0,
            currentPage: parseInt(usersData?.currentPage || '1'),
            totalPages: usersData?.totalPages || 0,
            limit: parseInt(usersData?.limit || '10'),
            hasNextPage: usersData?.hasNextPage || false,
            hasPreviousPage: usersData?.hasPreviousPage || false,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
