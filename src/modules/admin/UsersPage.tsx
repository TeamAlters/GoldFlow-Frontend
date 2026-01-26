import { useState, useMemo } from 'react'
import DataTable from '../../shared/components/DataTable'
import type { TableColumn, TableAction } from '../../shared/components/DataTable'
import FilterComponent, { type FilterComponentConfig, type FilterValue } from '../../shared/components/FilterComponent'
import { useUIStore } from '../../stores/ui.store'

// User type definition
type User = {
  id: number
  name: string
  email: string
  role: string
  mobileNo: string
}

export default function UsersPage() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, FilterValue>>({})
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@goldflow.com',
      role: 'Admin',
      mobileNo: '0987654321',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@goldflow.com',
      role: 'Manager',
      mobileNo: '0987654321',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@goldflow.com',
      role: 'Operator',
      mobileNo: '0987654321',
    },
    {
      id: 4,
      name: 'Alice Williams',
      email: 'alice.williams@goldflow.com',
      role: 'Supervisor',
      mobileNo: '0987654321',
    },
    {
      id: 5,
      name: 'Charlie Brown',
      email: 'charlie.brown@goldflow.com',
      role: 'Operator',
      mobileNo: '0987654321',
    },
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@goldflow.com',
      role: 'Admin',
      mobileNo: '0987654321',
    },
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@goldflow.com',
      role: 'Admin',
      mobileNo: '0987654321',
    },
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@goldflow.com',
      role: 'Admin',
      mobileNo: '0987654321',
    },
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@goldflow.com',
      role: 'Admin',
      mobileNo: '0987654321',
    },

  ])

  // Define table columns
  const columns: TableColumn<User>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px',
      align: 'center',
    },
    {
      key: 'first name',
      header: 'First Name',
      sortable: true,
      accessor: (row) => {
        const firstName = row.name.split(' ')[0] || row.name
        return (
          <div className="flex items-center gap-3">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              {firstName}
            </span>
          </div>
        )
      },
    },
    {
      key: 'last name',
      header: 'Last Name',
      sortable: true,
      accessor: (row) => {
        const nameParts = row.name.split(' ')
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-'
        return (
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {lastName}
          </span>
        )
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      accessor: (row) => (
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          {row.email}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      align: 'center',
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${row.role === 'Admin'
            ? isDarkMode
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-purple-100 text-purple-700'
            : row.role === 'Manager'
              ? isDarkMode
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-700'
              : row.role === 'Supervisor'
                ? isDarkMode
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-100 text-green-700'
                : isDarkMode
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-gray-100 text-gray-700'
            }`}
        >
          {row.role}
        </span>
      ),
    },

    {
      key: 'mobileNo',
      header: 'Mobile No',
      sortable: true,
      accessor: (row) => (
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {row.mobileNo}
        </span>
      ),
    },
  ]

  // Define table actions
  const actions: TableAction<User>[] = [
    {
      label: 'Edit',
      onClick: (row) => {
        console.log('Edit user:', row)
        // Add your edit logic here
      },
      variant: 'primary',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      label: 'Delete',
      onClick: (row) => {
        if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
          setUsers(users.filter((u) => u.id !== row.id))
        }
      },
      variant: 'danger',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
  ]

  // Filter configuration
  const filterConfig: FilterComponentConfig = {
    default: {
      email: {
        key: 'email',
        label: 'Email',
        dataType: 'string',
      },
      'first name': {
        key: 'first name',
        label: 'First Name',
        dataType: 'string',
      },
      role: {
        key: 'role',
        label: 'Role',
        dataType: 'select',
        options: [
          { label: 'Admin', value: 'Admin' },
          { label: 'Manager', value: 'Manager' },
          { label: 'Supervisor', value: 'Supervisor' },
          { label: 'Operator', value: 'Operator' },
        ],
      },
    },
    addable: {
      'last name': {
        key: 'last name',
        label: 'Last Name',
        dataType: 'string',
      },
      mobileNo: {
        key: 'mobileNo',
        label: 'Mobile No',
        dataType: 'string',
      },
    },
  }

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    let result = users

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      result = result.filter((user) => {
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.role.toLowerCase().includes(searchLower) ||
          user.mobileNo.includes(searchQuery)
        )
      })
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return
      }

      result = result.filter((user) => {
        switch (key) {
          case 'email':
            return typeof value === 'string' && user.email.toLowerCase().includes(value.toLowerCase())
          
          case 'first name': {
            const firstName = user.name.split(' ')[0] || user.name
            return typeof value === 'string' && firstName.toLowerCase().includes(value.toLowerCase())
          }
          
          case 'last name': {
            const nameParts = user.name.split(' ')
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
            return typeof value === 'string' && lastName.toLowerCase().includes(value.toLowerCase())
          }
          
          case 'role':
            return typeof value === 'string' && user.role === value
          
          case 'mobileNo':
            return typeof value === 'string' && user.mobileNo.includes(value)
          
          default:
            return true
        }
      })
    })

    return result
  }, [users, searchQuery, filters])

  const handleRowClick = (row: User) => {
    console.log('Row clicked:', row)
    // Navigate to user detail page or open modal
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Users Management
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage all users and their permissions
        </p>
      </div>

      {/* Toolbar - Search, Total Users, and Add Button */}
      <div className={`mb-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Side - Search and Total */}
          <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            

            {/* Total Users */}
            <div className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>Total Users:</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {filteredUsers.length}
              </span>
            </div>
          </div>

          {/* Right Side - Add User Button */}
          <div className="w-full sm:w-auto">
            <button
              className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                }`}
              onClick={() => {
                console.log('Add new user')
                // Add your add user logic here
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add User</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Component */}
      <div className="mb-4">
        <FilterComponent
          columns={columns}
          config={filterConfig}
          onFilterChange={setFilters}
          initialFilters={filters}
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        actions={actions}
        searchable={false}
        pagination={true}
        pageSize={10}
        onRowClick={handleRowClick}
        emptyMessage="No users found"
      />
    </div>
  )
}
