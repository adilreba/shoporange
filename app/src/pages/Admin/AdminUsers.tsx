import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Mail, Phone, Calendar, Trash2, RefreshCw, 
  AlertTriangle, UserX, UserCheck, Shield, Edit2
} from 'lucide-react';
import { api, userApi, isMockMode } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_USERS } from '@/data/mockUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole, User } from '@/types';
import { ROLE_NAMES, ROLE_COLORS } from '@/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// User tipi @/types'den geliyor

// Hassas veriyi maskele
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  return `${maskedLocal}@${domain}`;
};

const maskPhone = (phone: string): string => {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  const countryCode = phone.startsWith('+') ? phone.split(' ')[0] : '';
  return `${countryCode} *** ** ** ${last4}`;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [activeTab, setActiveTab] = useState('active');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  
  // Yetki kontrolü
  const { can, isSuperAdmin, userRole: currentUserRole } = usePermissions();
  const canDelete = can('users:delete');
  const canEdit = can('users:edit');
  
  // Kullanıcının görebileceği rolleri belirle
  const getVisibleRoles = (): UserRole[] => {
    if (isSuperAdmin) return ['super_admin', 'admin', 'editor', 'support', 'user'];
    if (currentUserRole === 'admin') return ['admin', 'editor', 'support', 'user'];
    if (currentUserRole === 'editor') return ['editor', 'support', 'user'];
    if (currentUserRole === 'support') return ['support', 'user'];
    return ['user'];
  };
  
  // Kullanıcıları filtrele (arama + rol) - useMemo ile optimize edildi
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Önce yetki kontrolü - kullanıcı kendi seviyesinden yüksek rolü göremez
      if (!getVisibleRoles().includes(user.role)) return false;
      
      // Rol filtresi
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      
      // Arama filtresi
      const search = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.phone && user.phone.includes(search))
      );
    });
  }, [users, searchTerm, roleFilter, isSuperAdmin, currentUserRole]);
  
  // Rol sayıları (görünen kullanıcılar için)
  const roleCounts = {
    super_admin: users.filter(u => u.role === 'super_admin' && getVisibleRoles().includes('super_admin')).length,
    admin: users.filter(u => u.role === 'admin' && getVisibleRoles().includes('admin')).length,
    editor: users.filter(u => u.role === 'editor' && getVisibleRoles().includes('editor')).length,
    support: users.filter(u => u.role === 'support' && getVisibleRoles().includes('support')).length,
    user: users.filter(u => u.role === 'user' && getVisibleRoles().includes('user')).length,
  };

  useEffect(() => {
    fetchUsers();
    
    // Sayfa odaklandığında kullanıcı listesini yenile (yeni kullanıcılar için)
    const handleFocus = () => {
      if (isMockMode()) {
        fetchUsers();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Mock mode'da authStore'daki MOCK_USERS kullan
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[AdminUsers] fetchUsers START - Mock Mode');
        
        // Ana kullanıcı kaynağı: authStore.ts'deki MOCK_USERS
        // Şifreleri çıkararak kullanıcı listesi oluştur
        console.log('[AdminUsers] MOCK_USERS:', MOCK_USERS.map((u: any) => ({ id: u.id, email: u.email, role: u.role })));
        const baseUsers = MOCK_USERS.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          createdAt: u.createdAt,
          isActive: u.isActive !== false,
          avatar: u.avatar,
          address: u.address || [],
        }));
        
        // localStorage'dan ek kullanıcıları al (Google login ile gelenler)
        let extraUsers: User[] = [];
        try {
          const saved = localStorage.getItem('google-users');
          if (saved) {
            const parsed = JSON.parse(saved);
            // Sadece authStore'da olmayan kullanıcıları ekle
            extraUsers = parsed.filter((u: any) => 
              !baseUsers.find((bu: User) => bu.email === u.email)
            );
          }
        } catch (e) {
          console.log('[AdminUsers] localStorage okuma hatası:', e);
        }
        
        // Tüm kullanıcıları birleştir
        const finalUsers = [...baseUsers, ...extraUsers];
        console.log('[AdminUsers] Kullanıcılar:', finalUsers.map((u: any) => ({ id: u.id, email: u.email, role: u.role })));
        
        setUsers(finalUsers);
        setDeletedUsers([]);
        return;
      }
      
      const activeRes = await api.get('/admin/users');
      const allUsers = activeRes.data || [];
      const activeUsers = allUsers.filter((u: User) => u.isActive !== false);
      
      let deleted: User[] = [];
      try {
        const deletedRes = await userApi.getDeletedUsers();
        deleted = deletedRes.data || [];
      } catch (deletedErr) {
        console.log('[AdminUsers] Deleted users endpoint not available yet:', deletedErr);
        deleted = [];
      }
      
      setUsers(activeUsers);
      setDeletedUsers(deleted);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken bir sorun oluştu');
      // Hata durumunda boş liste göster
      setUsers([]);
      setDeletedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await userApi.softDelete(userToDelete.id, 'admin');
      toast.success(`${userToDelete.name} pasif yapıldı`);
      fetchUsers();
    } catch (error) {
      toast.error('İşlem başarısız oldu');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleRestore = async () => {
    if (!userToRestore) return;
    
    try {
      await userApi.restore(userToRestore.id);
      toast.success(`${userToRestore.name} aktif edildi`);
      fetchUsers();
    } catch (error) {
      toast.error('İşlem başarısız oldu');
    } finally {
      setUserToRestore(null);
    }
  };

  const handleRoleChange = async () => {
    if (!userToChangeRole) return;
    
    console.log('[AdminUsers] handleRoleChange START - user:', userToChangeRole.id, userToChangeRole.email, 'newRole:', selectedRole);
    
    // Süper admin sadece süper admin tarafından atanabilir
    if (selectedRole === 'super_admin' && !isSuperAdmin) {
      toast.error('Sadece Süper Admin bu rolü atayabilir');
      return;
    }
    
    // Kendi rolünü değiştiremez
    if (userToChangeRole.id === 'admin-1' || userToChangeRole.id === 'current-user') {
      toast.error('Kendi rolünüzü değiştiremezsiniz');
      return;
    }

    console.log('[AdminUsers] handleRoleChange executing...');
    
    try {
      console.log('[AdminUsers] Calling userApi.updateRole...');
      
      // Mock mode'da doğrudan MOCK_USERS'ı güncelle
      if (isMockMode()) {
        const userIndex = MOCK_USERS.findIndex((u: any) => u.id === userToChangeRole.id);
        console.log('[AdminUsers] Found user in MOCK_USERS at index:', userIndex);
        if (userIndex !== -1) {
          MOCK_USERS[userIndex].role = selectedRole;
          console.log('[AdminUsers] MOCK_USERS updated:', MOCK_USERS[userIndex].email, '->', selectedRole);
        }
      }
      
      const result = await userApi.updateRole(userToChangeRole.id, selectedRole);
      console.log('[AdminUsers] updateRole result:', result);
      
      // Eğer değiştirilen kullanıcı şu an giriş yapmışsa, authStore'u güncelle
      const currentUser = useAuthStore.getState().user;
      if (currentUser && (currentUser.id === userToChangeRole.id || currentUser.email === userToChangeRole.email)) {
        console.log('[AdminUsers] Updating current user role in authStore:', selectedRole);
        useAuthStore.setState({ user: { ...currentUser, role: selectedRole } });
      }
      
      toast.success(`${userToChangeRole.name} kullanıcısının rolü ${ROLE_NAMES[selectedRole]} olarak güncellendi`);
      console.log('[AdminUsers] Calling fetchUsers...');
      await fetchUsers();
      console.log('[AdminUsers] fetchUsers completed');
    } catch (error) {
      console.error('[AdminUsers] handleRoleChange ERROR:', error);
      toast.error('Rol güncellenirken bir hata oluştu');
    } finally {
      setUserToChangeRole(null);
    }
  };

  const openRoleDialog = (user: User) => {
    setUserToChangeRole(user);
    setSelectedRole(user.role || 'user');
  };

  // Rol badge rengi
  const getRoleBadgeColor = (role: UserRole) => {
    return ROLE_COLORS[role] || 'bg-gray-400';
  };

  const filteredDeletedUsers = deletedUsers.filter(user => {
    // Yetki kontrolü
    if (!getVisibleRoles().includes(user.role)) return false;
    
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Rolünüz: <Badge className={ROLE_COLORS[currentUserRole]}>{ROLE_NAMES[currentUserRole]}</Badge>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Kullanıcı</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{users.length}</p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Süper Admin</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {users.filter(u => u.role === 'super_admin').length}
            </p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Editör/Destek</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {users.filter(u => ['editor', 'support'].includes(u.role)).length}
            </p>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-border">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pasif</p>
            <p className="text-2xl font-bold text-gray-500 mt-1">{deletedUsers.length}</p>
          </div>
        </div>

        {/* Tabs ve Rol Filtreleri */}
        <div className="space-y-4 mb-6">
          {/* Üst Satır: Tabs */}
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="active" className="flex items-center gap-2 flex-1 sm:flex-none">
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Aktif Kullanıcılar</span>
                <span className="sm:hidden">Aktif</span>
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                  {users.filter(u => getVisibleRoles().includes(u.role)).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex items-center gap-2 flex-1 sm:flex-none">
                <UserX className="w-4 h-4" />
                <span className="hidden sm:inline">Pasif Kullanıcılar</span>
                <span className="sm:hidden">Pasif</span>
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                  {filteredDeletedUsers.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          </div>
          
          {/* Alt Satır: Rol Filtre Butonları */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              variant={roleFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('all')}
              className={`text-xs sm:text-sm ${roleFilter === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
            >
              Tümü
            </Button>
            
            {isSuperAdmin && (
              <Button
                variant={roleFilter === 'super_admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('super_admin')}
                className={`text-xs sm:text-sm ${roleFilter === 'super_admin' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
              >
                <Shield className="w-3 h-3 mr-1 hidden sm:inline" />
                Süper ({roleCounts.super_admin})
              </Button>
            )}
            
            {(isSuperAdmin || currentUserRole === 'admin') && (
              <Button
                variant={roleFilter === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('admin')}
                className={`text-xs sm:text-sm ${roleFilter === 'admin' ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                Admin ({roleCounts.admin})
              </Button>
            )}
            
            <Button
              variant={roleFilter === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('editor')}
              className={`text-xs sm:text-sm ${roleFilter === 'editor' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            >
              Editör ({roleCounts.editor})
            </Button>
            
            <Button
              variant={roleFilter === 'support' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('support')}
              className={`text-xs sm:text-sm ${roleFilter === 'support' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              Destek ({roleCounts.support})
            </Button>
            
            <Button
              variant={roleFilter === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('user')}
              className={`text-xs sm:text-sm ${roleFilter === 'user' ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
            >
              Müşteri ({roleCounts.user})
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4 mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <Input
            placeholder="Kullanıcı ara (isim, email, telefon)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Active Users Tab */}
          <TabsContent value="active">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>İletişim (Maskeli)</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                          <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                            {ROLE_NAMES[user.role] || 'Müşteri'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.email && (
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                {maskEmail(user.email)}
                              </div>
                            )}
                            {user.phone && (
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                {maskPhone(user.phone)}
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
                          <div className="flex items-center justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  Detaylar
                                </Button>
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
                                      <Badge className={`${getRoleBadgeColor(user.role)} text-white mt-1`}>
                                        {ROLE_NAMES[user.role] || 'Müşteri'}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                    {user.email && (
                                      <div className="flex items-center">
                                        <Mail className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                                        <div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">Email (Maskeli)</p>
                                          <p className="font-medium text-gray-900 dark:text-white">{maskEmail(user.email)}</p>
                                        </div>
                                      </div>
                                    )}

                                    {user.phone && (
                                      <div className="flex items-center">
                                        <Phone className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                                        <div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">Telefon (Maskeli)</p>
                                          <p className="font-medium text-gray-900 dark:text-white">{maskPhone(user.phone)}</p>
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

                                  {user.address && user.address.length > 0 && (
                                    <div>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Adres</p>
                                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-gray-900 dark:text-white">
                                        <p>{user.address[0].addressLine}</p>
                                        <p>{user.address[0].city}, {user.address[0].zipCode}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Rol Değiştir Butonu - Sadece yetkisi olanlar */}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRoleDialog(user)}
                                title="Rol Değiştir"
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Sil Butonu - Sadece yetkisi olanlar */}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => setUserToDelete(user)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Deleted Users Tab */}
          <TabsContent value="deleted">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-border">
              {deletedUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Pasif kullanıcı bulunmuyor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>Silinme Tarihi</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeletedUsers.map((user) => (
                      <TableRow key={user.id} className="bg-red-50/50 dark:bg-red-900/10">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                              <UserX className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                {user.name || 'İsimsiz'}
                                <Badge variant="destructive" className="text-xs">Pasif</Badge>
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="opacity-50">
                            {ROLE_NAMES[user.role] || 'Müşteri'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.email && (
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {maskEmail(user.email)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            {user.deletedAt ? formatDate(user.deletedAt) : 'Bilinmiyor'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setUserToRestore(user)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Aktif Et
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Soft Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Kullanıcıyı Pasif Yap
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.name}</strong> kullanıcısını pasif yapmak istediğinize emin misiniz?
              <br /><br />
              <span className="text-yellow-600 dark:text-yellow-400">
                ⚠️ Bu işlem kullanıcıyı sistemden silmez, sadece pasif duruma getirir. 
                Verileri korunur ve daha sonra geri aktif edilebilir.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSoftDelete}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Pasif Yap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!userToRestore} onOpenChange={() => setUserToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Kullanıcıyı Aktif Et
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToRestore?.name}</strong> kullanıcısını tekrar aktif etmek istediğinize emin misiniz?
              <br /><br />
              Kullanıcı giriş yapabilir ve tüm işlemlerine devam edebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Aktif Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <AlertDialog open={!!userToChangeRole} onOpenChange={() => setUserToChangeRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Rol Değiştir
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToChangeRole?.name}</strong> kullanıcısının rolünü değiştir:
              <div className="mt-4">
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Süper admin sadece süper admin tarafından atanabilir */}
                    {(isSuperAdmin) && (
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Süper Admin - Tüm yetkiler
                        </div>
                      </SelectItem>
                    )}
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Admin - Kullanıcı ve ürün yönetimi
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Editör - İçerik yönetimi
                      </div>
                    </SelectItem>
                    <SelectItem value="support">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Destek - Canlı destek ve sipariş
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Müşteri - Standart kullanıcı
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRoleChange}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Rolü Güncelle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
