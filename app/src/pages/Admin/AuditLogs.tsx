import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Shield, AlertTriangle, 
  Info, XCircle, User, Server, CreditCard, 
  ShoppingCart, FileText, Download, RefreshCw,
  Lock
} from 'lucide-react';
import { auditLogApi } from '@/services/auditLogApi';
import type { AuditLogEntry, AuditEventType, SeverityLevel } from '@/services/auditLogApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Event type renkleri ve ikonları
const EVENT_CONFIG: Record<AuditEventType, { color: string; icon: any; label: string }> = {
  USER_LOGIN: { color: 'bg-green-500', icon: User, label: 'Giriş' },
  USER_LOGOUT: { color: 'bg-gray-500', icon: User, label: 'Çıkış' },
  USER_REGISTER: { color: 'bg-blue-500', icon: User, label: 'Kayıt' },
  USER_UPDATE: { color: 'bg-yellow-500', icon: User, label: 'Profil Güncelleme' },
  PASSWORD_CHANGE: { color: 'bg-orange-500', icon: Lock, label: 'Şifre Değişikliği' },
  PASSWORD_RESET: { color: 'bg-purple-500', icon: Lock, label: 'Şifre Sıfırlama' },
  ORDER_CREATE: { color: 'bg-blue-600', icon: ShoppingCart, label: 'Sipariş Oluşturma' },
  ORDER_UPDATE: { color: 'bg-blue-400', icon: ShoppingCart, label: 'Sipariş Güncelleme' },
  ORDER_CANCEL: { color: 'bg-red-500', icon: ShoppingCart, label: 'Sipariş İptali' },
  ORDER_REFUND: { color: 'bg-yellow-600', icon: ShoppingCart, label: 'İade' },
  PAYMENT_ATTEMPT: { color: 'bg-indigo-500', icon: CreditCard, label: 'Ödeme Denemesi' },
  PAYMENT_SUCCESS: { color: 'bg-green-600', icon: CreditCard, label: 'Başarılı Ödeme' },
  PAYMENT_FAILURE: { color: 'bg-red-600', icon: CreditCard, label: 'Başarısız Ödeme' },
  DATA_EXPORT: { color: 'bg-cyan-500', icon: Download, label: 'Veri İndirme' },
  DATA_DELETE: { color: 'bg-red-700', icon: XCircle, label: 'Veri Silme' },
  ADMIN_ACTION: { color: 'bg-purple-600', icon: Shield, label: 'Admin İşlemi' },
  SECURITY_ALERT: { color: 'bg-red-800', icon: AlertTriangle, label: 'Güvenlik Uyarısı' },
};

// Severity renkleri
const SEVERITY_CONFIG: Record<SeverityLevel, { color: string; bgColor: string; icon: any }> = {
  info: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Info },
  warning: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle },
  error: { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
  critical: { color: 'text-red-800', bgColor: 'bg-red-100', icon: AlertTriangle },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventType, setFilterEventType] = useState<AuditEventType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { can } = usePermissions();
  const canViewAudit = can('audit:view');

  useEffect(() => {
    if (canViewAudit) {
      fetchLogs();
      fetchStats();
    }
  }, [page, filterEventType, filterSeverity, canViewAudit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogApi.getAll({
        page,
        limit: 20,
        eventType: filterEventType === 'all' ? undefined : filterEventType,
        severity: filterSeverity === 'all' ? undefined : filterSeverity,
      });
      setLogs(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Denetim kayıtları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditLogApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return formatDate(dateString);
  };

  const maskIp = (ip: string) => {
    if (!ip || ip === 'unknown') return 'Bilinmiyor';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip;
  };

  // Arama filtresi
  const filteredLogs = logs.filter(log =>
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ipAddress?.includes(searchTerm)
  );

  if (!canViewAudit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 dark:text-gray-400">Bu sayfayı görüntüleme yetkiniz yok.</p>
          <Link to="/admin" className="text-orange-500 hover:underline mt-4 inline-block">
            Admin Paneline Dön
          </Link>
        </div>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Denetim Kayıtları</h1>
                <p className="text-sm text-gray-500 mt-1">KVKK/GDPR uyumlu işlem geçmişi</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Toplam Kayıt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Bugün</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Kritik Uyarı</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{stats.bySeverity?.critical || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Hata</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{stats.bySeverity?.error || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-border mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ara (email, işlem, IP...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterEventType} onValueChange={(v) => setFilterEventType(v as AuditEventType | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Olay Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Olaylar</SelectItem>
                <SelectItem value="USER_LOGIN">Giriş</SelectItem>
                <SelectItem value="ORDER_CREATE">Sipariş</SelectItem>
                <SelectItem value="PAYMENT_SUCCESS">Ödeme</SelectItem>
                <SelectItem value="ADMIN_ACTION">Admin İşlemi</SelectItem>
                <SelectItem value="SECURITY_ALERT">Güvenlik</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as SeverityLevel | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Önem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="info">Bilgi</SelectItem>
                <SelectItem value="warning">Uyarı</SelectItem>
                <SelectItem value="error">Hata</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Yükleniyor...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Denetim kaydı bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Olay</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Zaman</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const eventConfig = EVENT_CONFIG[log.eventType] || { 
                    color: 'bg-gray-500', 
                    icon: Server, 
                    label: log.eventType 
                  };
                  const severityConfig = SEVERITY_CONFIG[log.severity];
                  const EventIcon = eventConfig.icon;
                  const SeverityIcon = severityConfig.icon;

                  return (
                    <TableRow 
                      key={log.logId} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full ${eventConfig.color} flex items-center justify-center`}>
                          <EventIcon className="w-4 h-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{eventConfig.label}</p>
                          <p className="text-xs text-gray-500">{log.action}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{log.userEmail || 'Anonim'}</p>
                          {log.userRole && (
                            <Badge variant="outline" className="text-xs">{log.userRole}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatRelativeTime(log.timestamp)}</p>
                          <p className="text-xs text-gray-400">{formatDate(log.timestamp)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 font-mono">{maskIp(log.ipAddress)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SeverityIcon className={`w-4 h-4 ${severityConfig.color}`} />
                          {!log.success && (
                            <Badge variant="destructive" className="text-xs">Başarısız</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Sayfa {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-card dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              {selectedLog && (
                <>
                  <div className={`w-8 h-8 rounded-full ${EVENT_CONFIG[selectedLog.eventType]?.color || 'bg-gray-500'} flex items-center justify-center`}>
                    {(() => {
                      const Icon = EVENT_CONFIG[selectedLog.eventType]?.icon || Server;
                      return <Icon className="w-4 h-4 text-white" />;
                    })()}
                  </div>
                  {EVENT_CONFIG[selectedLog.eventType]?.label || selectedLog?.eventType}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="mt-4 space-y-4">
              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                <Badge className={`${SEVERITY_CONFIG[selectedLog.severity].bgColor} ${SEVERITY_CONFIG[selectedLog.severity].color}`}>
                  {selectedLog.severity.toUpperCase()}
                </Badge>
                {!selectedLog.success && (
                  <Badge variant="destructive">Başarısız</Badge>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Kullanıcı</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedLog.userEmail || 'Anonim'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kullanıcı ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedLog.userId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IP Adresi</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tarih/Saat</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kaynak</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resource}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kaynak ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedLog.resourceId || '-'}</p>
                </div>
              </div>

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Hata Mesajı:</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{selectedLog.errorMessage}</p>
                </div>
              )}

              {/* Details JSON */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Detaylar:</p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">User Agent:</p>
                  <p className="text-xs text-gray-400 break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {/* Log ID */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400">Log ID: <span className="font-mono">{selectedLog.logId}</span></p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
