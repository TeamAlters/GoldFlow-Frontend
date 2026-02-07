import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserForm, { type UserFormData } from './UserForm';
import { useUIStore } from '../../stores/ui.store';

// User type definition (should match UsersPage)
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  mobileNo: string;
};

// This would typically come from an API or context/store
// For now, we'll use localStorage or a simple in-memory store
// In a real app, you'd fetch this from an API
const getUsersFromStorage = (): User[] => {
  const stored = localStorage.getItem('users');
  return stored ? JSON.parse(stored) : [];
};

const saveUsersToStorage = (users: User[]) => {
  localStorage.setItem('users', JSON.stringify(users));
};

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const isEdit = !!id;
  const userId = id ? parseInt(id, 10) : null;

  const [initialData, setInitialData] = useState<Partial<UserFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(isEdit);

  // Load user data if editing
  useEffect(() => {
    if (isEdit && userId) {
      // In a real app, fetch from API
      const users = getUsersFromStorage();
      const user = users.find((u) => u.id === userId);
      if (user) {
        setInitialData({
          name: user.name,
          email: user.email,
          role: user.role,
          mobileNo: user.mobileNo,
        });
      }
      setLoading(false);
    }
  }, [isEdit, userId]);

  const handleSubmit = (formData: UserFormData) => {
    const users = getUsersFromStorage();

    if (isEdit && userId) {
      // Update existing user
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, ...formData } : user
      );
      saveUsersToStorage(updatedUsers);
    } else {
      // Create new user
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id), 0) + 1,
        ...formData,
      };
      saveUsersToStorage([...users, newUser]);
    }

    // Dispatch custom event to notify UsersPage of the update
    window.dispatchEvent(new Event('usersUpdated'));

    // Navigate back to users page
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header - Matching UsersPage style */}
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {isEdit ? 'Edit User' : 'Add New User'}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {isEdit
            ? 'Update user information and permissions'
            : 'Create a new user account with role-based access'}
        </p>
      </div>

      {/* Form Container - Matching UsersPage toolbar style */}
      <div
        className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <UserForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
