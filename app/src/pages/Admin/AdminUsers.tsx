import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Kullanıcı</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{users.length}</p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay Yeni</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {users.filter(u => {
                const userDate = new Date(u.createdAt);
                const now = new Date();
                return userDate.getMonth() === now.getMonth() && 
                       userDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Telefonlu Kullanıcı</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {users.filter(u => u.phone).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <Input
            placeholder="Kullanıcı ara (isim, email, telefon)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Kullanıcı bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name || 'İsimsiz'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            Detaylar
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg bg-card dark:bg-gray-800">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white">Kullanıcı Detayı</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-4">
                                <span className="text-orange-600 dark:text-orange-400 font-bold text-2xl">
                                  {user.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-lg text-gray-900 dark:text-white">{user.name || 'İsimsiz'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.id}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                              {user.email && (
                                <div className="flex items-center">
                                  <Mail className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                                  </div>
                                </div>
                              )}

                              {user.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.phone}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center">
                                <Calendar className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Kayıt Tarihi</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                                </div>
                              </div>
                            </div>

                            {user.address && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Adres</p>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-gray-900 dark:text-white">
                                  <p>{user.address.street}</p>
                                  <p>{user.address.city}, {user.address.postalCode}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
