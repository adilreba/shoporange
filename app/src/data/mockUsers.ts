// Ortak mock kullanıcılar - authStore ve api arasında paylaşım için

const loadGoogleUsersFromStorage = () => {
  try {
    const saved = localStorage.getItem('google-users');
    if (saved) {
      const googleUsers = JSON.parse(saved);
      console.log('[loadGoogleUsers] Loaded from localStorage:', googleUsers.length, 'users');
      return googleUsers;
    }
  } catch (e) {
    console.log('[loadGoogleUsers] Error loading:', e);
  }
  return [];
};

export const MOCK_USERS: any[] = [
  ...loadGoogleUsersFromStorage(),
  {
    id: 'superadmin-1',
    email: 'superadmin@atushome.com',
    password: 'AtusHome2024!',
    name: 'Super Admin',
    role: 'super_admin',
    phone: '+90 555 999 0000',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: '2024-01-01'
  },
  {
    id: 'admin-1',
    email: 'admin@atushome.com',
    password: 'Admin1234',
    name: 'Admin Kullanıcı',
    role: 'admin',
    phone: '+90 555 999 8888',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: '2024-01-01'
  },
  {
    id: 'user-1',
    email: 'test@example.com',
    password: 'User1234',
    name: 'Test Kullanıcı',
    role: 'user',
    phone: '+90 555 123 4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [
      {
        id: 'addr-1',
        title: 'Ev',
        fullName: 'Test Kullanıcı',
        phone: '+90 555 123 4567',
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Moda',
        addressLine: 'Moda Caddesi No:123 D:5',
        zipCode: '34710',
        isDefault: true
      }
    ],
    createdAt: '2024-01-01'
  }
];
