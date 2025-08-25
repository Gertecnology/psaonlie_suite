import { PageLayout } from '@/components/layout/page-layout'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { userListSchema } from './data/schema'
import { users } from './data/users'

export default function Users() {
  // Parse user list
  const userList = userListSchema.parse(users)

  return (
    <UsersProvider>
      <PageLayout
        title="User List"
        description="Manage your users and their roles here."
        actions={<UsersPrimaryButtons />}
      >
        <UsersTable data={userList} columns={columns} />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
