// Ortak mock kullanıcılar - authStore ve api arasında paylaşım için
// NOT: Bu dosya SADECE geliştirme/test ortamı içindir.
// Production build'inde bu dosyanın kullanılmadığından emin olun.

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

// Şifreler bcrypt hash ile korunuyor (12 rounds)
// Orijinal şifreler (sadece geliştirme ortamında):
//   superadmin@atushome.com -> AtusHome2024!
//   admin@atushome.com -> Admin1234
//   test@example.com -> User1234
export const MOCK_USERS: any[] = [
  ...loadGoogleUsersFromStorage(),
  {
    id: 'superadmin-1',
    email: 'superadmin@atushome.com',
    password: '$2b$12$zHAkjRAmisusCprCEtpTj.SUrOGoUE9tN7nVxjdouRhbWPjxOBP4.',
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
    password: '$2b$12$GUzbB1v/r7bNFSNn9Kfdb.aSfnk6PiS.IPNMV8X.YpZA/U0LqQoKW',
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
    password: '$2b$12$Yg73Cyh0Qbvd3hZwaZENie0/JPAum7TgjcvFJDoj4aHcaWIJCZOfW',
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
