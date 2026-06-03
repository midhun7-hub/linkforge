import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  Copy,
  Trash2,
  QrCode,
  Search,
  ExternalLink,
  Edit,
  Sparkles,
  Layers,
  ArrowUpRight,
  MousePointer,
  Zap,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { useUrls, useDeleteUrl, useUpdateUrl } from '../hooks/useUrls';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import PasswordVerificationModal from '../components/PasswordVerificationModal';
import CreateLinkModal from '../components/CreateLinkModal';
import BulkCreateModal from '../components/BulkCreateModal';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import LinkForgeLogo from '../components/LinkForgeLogo';
import { cn } from '../utils/cn';

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide capitalize',
        isActive ? 'bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--danger-muted)] text-[var(--danger)]'
      )}
    >
      <span className="relative flex h-2 w-2">
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isActive ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
          )}
        />
      </span>
      {status}
    </span>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: urls, isLoading } = useUrls();
  const deleteUrl = useDeleteUrl();
  const updateUrl = useUpdateUrl();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [editUrl, setEditUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [passwordModal, setPasswordModal] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const filteredUrls =
    urls?.filter(
      (url) =>
        url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        url.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalClicks = (urls || []).reduce((sum, url) => sum + (url.clickCount || 0), 0);
  const activeLinks = (urls || []).filter((url) => url.status === 'active').length;
  const totalLinks = urls?.length || 0;

  const productivitySummary = useMemo(() => {
    if (!urls?.length) return 'Create your first link to start tracking performance.';
    const latest = [...urls].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const latestLabel = latest
      ? `Latest link added ${new Date(latest.createdAt).toLocaleDateString()}`
      : '';
    return `${activeLinks} active · ${totalClicks.toLocaleString()} total clicks · ${latestLabel}`;
  }, [urls, activeLinks, totalClicks]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const kpiConfig = [
    { label: 'Total Links', value: totalLinks, icon: Link2 },
    { label: 'Active Links', value: activeLinks, icon: Zap },
    { label: 'Total Clicks', value: totalClicks, icon: MousePointer },
  ];

  const handleCopy = (url, urlObj) => {
    // If protected, require password verification first
    if (urlObj?.passwordProtected) {
      setPasswordModal(urlObj.shortCode);
      setPendingAction({ type: 'copy', url: url });
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const handlePasswordVerified = () => {
    if (pendingAction?.type === 'copy') {
      navigator.clipboard.writeText(pendingAction.url);
      toast.success('URL copied to clipboard!');
    }
    setPasswordModal(null);
    setPendingAction(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this URL?')) {
      const clickTs = performance.now();
      await deleteUrl.mutateAsync({ id, clickTs });
    }
  };

  const handleEditOpen = (url) => {
    setEditUrl(url);
    setEditOriginalUrl(url.originalUrl || '');
  };

  const handleViewTrends = (url) => {
    console.log('[Trends Click] Dashboard Trends button clicked', {
      urlId: url._id,
      shortCode: url.shortCode,
      shortUrl: url.shortUrl,
      clickCount: url.clickCount || 0,
    });
    navigate(`/analytics?urlId=${url._id}`);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const nextUrl = editOriginalUrl.trim();

    if (!nextUrl) {
      toast.error('Destination URL is required');
      return;
    }

    if (!isValidUrl(nextUrl)) {
      toast.error('Please enter a valid URL (http/https)');
      return;
    }

    await updateUrl.mutateAsync({ id: editUrl._id, data: { originalUrl: nextUrl } });
    setEditUrl(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8"
      >
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 100% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 50%), radial-gradient(ellipse 60% 50% at 0% 100%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 45%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--accent)] mb-1 flex items-center gap-2">
              <TrendingUp size={16} />
              Command Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="text-[var(--text-muted)] mt-2 text-base sm:text-lg leading-relaxed">
              {productivitySummary}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]">
                {totalLinks} links managed
              </span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
                Real-time analytics ready
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <motion.button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary flex items-center justify-center gap-2 px-6 py-3.5 text-base"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <Layers size={20} />
              Bulk Create
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-create-glow flex items-center justify-center gap-2 px-8 py-3.5 text-base"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <motion.span
                className="flex items-center gap-2"
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <motion.span whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Sparkles size={20} />
                </motion.span>
                Create Smart Link
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {kpiConfig.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.07, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="kpi-card group"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ background: 'var(--kpi-tint)' }}
            />
            <div className="relative flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                <stat.icon size={22} />
              </div>
            </div>
            <p className="relative text-sm font-medium text-[var(--text-muted)] mt-4">{stat.label}</p>
            <p className="relative text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">
              <AnimatedCounter target={stat.value} duration={1.2} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Links table */}
      <AnimatedCard className="premium-card !p-0 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your links</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {filteredUrls.length} {filteredUrls.length === 1 ? 'result' : 'results'}
              {searchTerm ? ` for "${searchTerm}"` : ''}
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
        </div>

        {filteredUrls.length === 0 ? (
          <div className="text-center py-16 px-6">
            <LinkForgeLogo size={56} className="w-14 h-14 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No smart links yet</h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              Launch your first premium short link and start tracking clicks instantly.
            </p>
            <motion.button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-create-glow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create your first link
            </motion.button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Destination
                  </th>
                  <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Short URL
                  </th>
                  <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Clicks
                  </th>
                  <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Created
                  </th>
                  <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Status
                  </th>
                  <th className="text-right py-4 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUrls.map((url, index) => (
                  <motion.tr
                    key={url._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.4) }}
                    whileHover={{ backgroundColor: 'var(--surface-hover)' }}
                    className="border-b border-[var(--border)]/80 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ExternalLink size={15} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                          {url.originalUrl}
                        </span>
                        {url.passwordProtected && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-xs font-semibold shrink-0" title="Password Protected">
                            <Lock size={12} />
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {url.passwordProtected ? (
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-[var(--accent)]" />
                          <span className="text-sm font-semibold text-[var(--text-muted)]">Protected Link</span>
                        </div>
                      ) : (
                        <a
                          href={url.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-link inline-flex items-center gap-1 hover:underline"
                        >
                          {url.shortUrl}
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                        {(url.clickCount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm text-[var(--text-muted)]">
                        {new Date(url.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={url.status} />
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        {[
                          { icon: Copy, onClick: () => handleCopy(url.shortUrl, url), title: 'Copy', className: '' },
                          {
                            icon: QrCode,
                            onClick: () => {
                              // If protected, require password first
                              if (url.passwordProtected) {
                                setPasswordModal(url.shortCode);
                                setPendingAction({ type: 'qr', urlObj: url });
                              } else {
                                setShowQRModal(url);
                              }
                            },
                            title: 'QR Code',
                            className: '',
                          },
                          {
                            icon: ExternalLink,
                            onClick: () => {
                              // If protected, redirect to password page with referrer
                              if (url.passwordProtected) {
                                navigate(`/verify-password?code=${url.shortCode}`, { state: { referrer: '/dashboard' } });
                              } else {
                                window.open(url.shortUrl, '_blank');
                              }
                            },
                            title: 'Open',
                            className: '',
                          },
                          { icon: Edit, onClick: () => handleEditOpen(url), title: 'Edit', className: '' },
                          {
                            icon: TrendingUp,
                            onClick: () => handleViewTrends(url),
                            title: 'Trends',
                            className: '',
                          },
                          {
                            icon: Trash2,
                            onClick: () => handleDelete(url._id),
                            title: 'Delete',
                            className: 'hover:bg-[var(--danger-muted)] hover:text-[var(--danger)]',
                          },
                        ].map(({ icon: Icon, onClick, title, className }) => (
                          <motion.button
                            key={title}
                            type="button"
                            onClick={onClick}
                            title={title}
                            className={cn(
                              'p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface)] transition-colors',
                              className
                            )}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                          >
                            <Icon size={16} />
                          </motion.button>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedCard>

      <CreateLinkModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOpenQR={(url) => {
          setShowCreateModal(false);
          setShowQRModal(url);
        }}
      />

      <BulkCreateModal open={showBulkModal} onClose={() => setShowBulkModal(false)} />

      {passwordModal && (
        <PasswordVerificationModal
          open={true}
          shortCode={passwordModal}
          mode="verify"
          onClose={() => {
            setPasswordModal(null);
            setPendingAction(null);
          }}
          onSuccess={() => {
            if (pendingAction?.type === 'qr') {
              setShowQRModal(pendingAction.urlObj);
            }
            handlePasswordVerified();
          }}
        />
      )}

      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: 'var(--overlay)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-modal w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">QR Code</h2>
              <button
                type="button"
                onClick={() => setShowQRModal(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <QRCodeGenerator url={showQRModal.shortUrl} />
          </motion.div>
        </div>
      )}

      {editUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: 'var(--overlay)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-modal w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Edit Destination URL</h2>
              <button
                type="button"
                onClick={() => setEditUrl(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Destination URL *
                </label>
                <input
                  type="url"
                  value={editOriginalUrl}
                  onChange={(e) => setEditOriginalUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/new-destination"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditUrl(null)}
                  className="flex-1 btn-secondary"
                  disabled={updateUrl.isLoading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={updateUrl.isLoading} className="flex-1 btn-primary">
                  {updateUrl.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
