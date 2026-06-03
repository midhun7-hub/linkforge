import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useUrls } from '../hooks/useUrls';
import {
  useAnalytics as useAnalyticsData,
  useTrends as useTrendsData,
  useWorkspaceAnalytics,
  useWorkspaceTrends,
  useCountryBreakdown,
  useReferrerBreakdown,
} from '../hooks/useAnalytics';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedCounter from '../components/AnimatedCounter';
import {
  MousePointer,
  Link2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Monitor,
  Globe,
  Activity,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
} from 'lucide-react';
import { cn } from '../utils/cn';

const DEVICE_ORDER = ['Desktop', 'Mobile', 'Tablet'];
const BROWSER_ORDER = ['Chrome', 'Edge', 'Firefox', 'Safari', 'Other'];

const DEVICE_COLORS = {
  Desktop: 'var(--chart-1)',
  Mobile: 'var(--chart-3)',
  Tablet: 'var(--chart-2)',
};

const BROWSER_COLORS = {
  Chrome: 'var(--chart-1)',
  Edge: 'var(--chart-2)',
  Firefox: 'var(--chart-4)',
  Safari: 'var(--chart-3)',
  Other: 'var(--chart-5)',
};

const tooltipStyle = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow)',
};

const normalizeDevice = (device) => {
  const d = (device || '').toLowerCase();
  if (d.includes('mobile')) return 'Mobile';
  if (d.includes('tablet')) return 'Tablet';
  return 'Desktop';
};

const normalizeBrowser = (browser) => {
  const b = (browser || '').toLowerCase();
  if (b.includes('chrome')) return 'Chrome';
  if (b.includes('edge')) return 'Edge';
  if (b.includes('firefox')) return 'Firefox';
  if (b.includes('safari')) return 'Safari';
  return 'Other';
};

const aggregateCounts = (visits, field, normalizer, order) => {
  const counts = order.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  visits.forEach((visit) => {
    const key = normalizer(visit[field] || '');
    if (counts[key] !== undefined) counts[key] += 1;
  });
  return order.map((name) => ({ name, value: counts[name] }));
};

const getTopFromVisits = (visits, key, normalizer) => {
  const map = {};
  visits.forEach((v) => {
    const label = normalizer ? normalizer(v[key]) : v[key] || 'Unknown';
    map[label] = (map[label] || 0) + 1;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
};

const DATE_RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const toDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRangeBounds = (preset, customFrom, customTo) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return { start, end };
    case '7d':
      start.setDate(start.getDate() - 6);
      return { start, end };
    case '30d':
      start.setDate(start.getDate() - 29);
      return { start, end };
    case '90d':
      start.setDate(start.getDate() - 89);
      return { start, end };
    case 'custom': {
      if (!customFrom || !customTo) return null;
      const customStart = new Date(`${customFrom}T00:00:00`);
      const customEnd = new Date(`${customTo}T23:59:59`);
      if (Number.isNaN(customStart.getTime()) || Number.isNaN(customEnd.getTime())) return null;
      if (customStart > customEnd) return null;
      return { start: customStart, end: customEnd };
    }
    default:
      return null;
  }
};

const formatChartLabel = (dateKey, dayCount) => {
  const d = new Date(`${dateKey}T12:00:00`);
  if (dayCount <= 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (dayCount <= 31) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
};

const buildTrendChartSeries = (daily, preset, customFrom, customTo) => {
  const bounds = getRangeBounds(preset, customFrom, customTo);
  if (!bounds) return { data: [], label: '' };

  const countByDate = {};
  (daily || []).forEach(({ date, count }) => {
    countByDate[date] = count;
  });

  const cursor = new Date(bounds.start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(bounds.end);
  endDay.setHours(0, 0, 0, 0);

  const points = [];
  while (cursor <= endDay) {
    const dateKey = toDateKey(cursor);
    points.push({ date: dateKey, count: countByDate[dateKey] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayCount = points.length;
  const data = points.map((p) => ({
    ...p,
    label: formatChartLabel(p.date, dayCount),
    fullDate: new Date(`${p.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }));

  const rangeLabels = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    custom: customFrom && customTo ? `${customFrom} → ${customTo}` : 'Custom range',
  };

  return { data, label: rangeLabels[preset] || '' };
};

const calcGrowthPercent = (daily) => {
  if (!daily?.length) return { value: 0, label: 'No trend data yet' };
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const prior = sorted.slice(-14, -7);
  const recentSum = recent.reduce((s, d) => s + (d.count || 0), 0);
  const priorSum = prior.reduce((s, d) => s + (d.count || 0), 0);
  if (priorSum === 0) {
    return {
      value: recentSum > 0 ? 100 : 0,
      label: recentSum > 0 ? 'New activity this week' : 'Flat vs last week',
    };
  }
  const pct = Math.round(((recentSum - priorSum) / priorSum) * 100);
  return {
    value: pct,
    label: pct >= 0 ? 'Up vs prior 7 days' : 'Down vs prior 7 days',
  };
};

const DeviceIcon = ({ name }) => {
  if (name === 'Mobile') return <Smartphone size={16} />;
  if (name === 'Tablet') return <Tablet size={16} />;
  return <Laptop size={16} />;
};

const HeroMetricCard = ({ label, children, gradientFrom, gradientTo, icon: Icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
    className="analytics-hero-card relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-lg"
    style={{
      background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    }}
  >
    <div className="hero-card-overlay absolute inset-0" />
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider theme-text-on-hero-muted">{label}</p>
        {Icon && (
          <div className="p-2 rounded-xl hero-metric-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>
      {children}
    </div>
  </motion.div>
);

const InsightWidget = ({ icon: Icon, label, value, sub, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ y: -3 }}
    className="glass-card p-4 sm:p-5 border border-[var(--border)]"
  >
    <div className="flex items-start gap-3">
      <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-bold text-[var(--text-primary)] mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  </motion.div>
);

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const displayDate = point?.fullDate || point?.label || payload[0].name;
  return (
    <div style={tooltipStyle} className="px-3 py-2.5 text-sm shadow-lg">
      <p className="font-medium text-[var(--text-primary)]">{displayDate}</p>
      <p className="text-[var(--accent)] font-semibold mt-1">
        {payload[0].value} click{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

const AnalyticsPage = () => {
  const { themeId } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: urls, isLoading: urlsLoading, isError: urlsError } = useUrls();
  const [selectedUrlId, setSelectedUrlId] = useState('all');
  const selectedUrlQueryId = selectedUrlId === 'all' ? null : selectedUrlId;
  const {
    data: selectedAnalytics,
    isLoading: selectedAnalyticsLoading,
    isError: selectedAnalyticsError,
  } = useAnalyticsData(selectedUrlQueryId);
  const {
    data: selectedTrends,
    isLoading: selectedTrendsLoading,
    isError: selectedTrendsError,
  } = useTrendsData(selectedUrlQueryId);
  const {
    data: workspaceAnalytics,
    isLoading: workspaceAnalyticsLoading,
    isError: workspaceAnalyticsError,
  } = useWorkspaceAnalytics();
  const {
    data: workspaceTrends,
    isLoading: workspaceTrendsLoading,
    isError: workspaceTrendsError,
  } = useWorkspaceTrends();
  const {
    data: countryBreakdown,
    isLoading: countryLoading,
  } = useCountryBreakdown(selectedUrlQueryId);
  const {
    data: referrerBreakdown,
    isLoading: referrerLoading,
  } = useReferrerBreakdown(selectedUrlQueryId);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);
  const [activeBrowserIndex, setActiveBrowserIndex] = useState(0);
  const [activeCountryIndex, setActiveCountryIndex] = useState(0);
  const [dateRangePreset, setDateRangePreset] = useState('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const urlIdFromQuery = searchParams.get('urlId');
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  useEffect(() => {
    if (!customFrom && !customTo) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setCustomFrom(toDateKey(start));
      setCustomTo(toDateKey(end));
    }
  }, [customFrom, customTo]);

  useEffect(() => {
    if (!urls?.length) return;

    if (urlIdFromQuery) {
      const matchingUrl = urls.find((url) => url._id === urlIdFromQuery);
      if (matchingUrl) {
        if (selectedUrlId !== urlIdFromQuery) {
          console.log('[Trends Route] Selecting URL from query param', {
            urlId: urlIdFromQuery,
            shortCode: matchingUrl.shortCode,
          });
          setSelectedUrlId(urlIdFromQuery);
        }
        return;
      }

      console.warn('[Trends Route] Ignoring unknown urlId query param', { urlId: urlIdFromQuery });
    }

    if (selectedUrlId !== 'all' && !urls.some((url) => url._id === selectedUrlId)) {
      console.log('[Trends Route] Falling back to all-link analytics');
      setSelectedUrlId('all');
    }
  }, [selectedUrlId, urlIdFromQuery, urls]);

  const showingAllLinks = selectedUrlId === 'all';
  const selectedUrl = urls?.find((u) => u._id === selectedUrlId);
  const analytics = showingAllLinks ? workspaceAnalytics : selectedAnalytics;
  const trends = showingAllLinks ? workspaceTrends : selectedTrends;
  const analyticsLoading = showingAllLinks ? workspaceAnalyticsLoading : selectedAnalyticsLoading;
  const trendsLoading = showingAllLinks ? workspaceTrendsLoading : selectedTrendsLoading;
  const analyticsError = showingAllLinks ? workspaceAnalyticsError : selectedAnalyticsError;
  const trendsError = showingAllLinks ? workspaceTrendsError : selectedTrendsError;
  const visits = analytics?.visits || [];
  const urlById = useMemo(() => {
    return (urls || []).reduce((acc, url) => {
      acc[url._id] = url;
      return acc;
    }, {});
  }, [urls]);

  const globalStats = useMemo(() => {
    const list = urls || [];
    const active = list.filter((u) => u.status === 'active').length;
    const totalClicks = list.reduce((s, u) => s + (u.clickCount || 0), 0);
    const top = [...list].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
    return { totalClicks, activeLinks: active, topLink: top };
  }, [urls]);

  const growth = useMemo(() => calcGrowthPercent(trends?.daily), [trends?.daily]);

  const trendChart = useMemo(
    () => buildTrendChartSeries(trends?.daily, dateRangePreset, customFrom, customTo),
    [trends?.daily, dateRangePreset, customFrom, customTo]
  );

  const chartData = trendChart.data;
  const customRangeInvalid =
    dateRangePreset === 'custom' && (!customFrom || !customTo || customFrom > customTo);

  const deviceData = useMemo(
    () => aggregateCounts(visits, 'device', normalizeDevice, DEVICE_ORDER).filter((d) => d.value > 0),
    [visits]
  );

  const browserData = useMemo(
    () => aggregateCounts(visits, 'browser', normalizeBrowser, BROWSER_ORDER).filter((d) => d.value > 0),
    [visits]
  );

  const topBrowser = useMemo(() => getTopFromVisits(visits, 'browser', normalizeBrowser), [visits]);
  const topDevice = useMemo(() => getTopFromVisits(visits, 'device', normalizeDevice), [visits]);

  const lastClickLabel = analytics?.lastVisit
    ? new Date(analytics.lastVisit).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No clicks yet';

  const countryChartData = useMemo(() => {
    if (!countryBreakdown?.length) return [];
    // Take top 10 countries + group rest as "Other"
    const sorted = [...countryBreakdown].sort((a, b) => b.count - a.count);
    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);
    if (rest.length > 0) {
      const otherCount = rest.reduce((sum, r) => sum + r.count, 0);
      top10.push({ country: 'Other', count: otherCount });
    }
    return top10.map((item) => ({ name: item.country, value: item.count }));
  }, [countryBreakdown]);

  const countryColors = useMemo(() => {
    const palette = [
      'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
      'var(--chart-4)', 'var(--chart-5)', 'var(--hero-clicks-from)',
      'var(--hero-active-from)', 'var(--hero-top-from)', 'var(--hero-growth-from)',
      '#8884d8', '#82ca9d',
    ];
    const map = {};
    countryChartData.forEach((item, i) => {
      map[item.name] = palette[i % palette.length];
    });
    return map;
  }, [countryChartData]);

  const timelineItems = useMemo(() => {
    return visits.slice(0, 12).map((visit) => ({
      device: normalizeDevice(visit.device),
      browser: normalizeBrowser(visit.browser),
      link:
        selectedUrl?.shortCode ||
        urlById[visit.urlId]?.shortCode ||
        urlById[String(visit.urlId)]?.shortCode ||
        '—',
      time: visit.timestamp,
    }));
  }, [visits, selectedUrl, urlById]);

  if (urlsLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (urlsError) {
    const errorMessage =
      urlsError?.response?.status === 503
        ? 'URL service is temporarily unavailable.'
        : urlsError?.message?.includes('Network Error')
          ? 'Network connection lost. Please check your internet connection.'
          : urlsError?.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load URLs. Please try again.';
    return (
      <div className="glass-card p-6">
        <p className="text-[var(--text-primary)] font-medium">{errorMessage}</p>
        {errorMessage.includes('Session') && (
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary mt-4">
            Go to Login
          </button>
        )}
      </div>
    );
  }

  if (!urls?.length) {
    return (
      <div className="glass-card p-10 text-center">
        <TrendingUp className="w-12 h-12 text-[var(--accent)] mx-auto mb-4 opacity-70" />
        <p className="text-[var(--text-primary)] font-medium">No links yet. Create a link to view analytics.</p>
      </div>
    );
  }

  const growthPositive = growth.value >= 0;

  return (
    <div className="space-y-8">
      {/* Command center header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 100% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent)',
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
            Analytics Command Center
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Performance Intelligence
          </h1>
          <p className="text-[var(--text-muted)] mt-2 max-w-2xl">
            Deep insights for your short links — clicks, devices, browsers, and live activity.
          </p>
        </div>
      </motion.section>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <HeroMetricCard
          label="Total Clicks"
          gradientFrom="var(--hero-clicks-from)"
          gradientTo="var(--hero-clicks-to)"
          icon={MousePointer}
          delay={0.05}
        >
          <p className="text-3xl sm:text-4xl font-bold theme-text-on-hero">
            <AnimatedCounter target={globalStats.totalClicks} duration={1.2} />
          </p>
          <p className="text-sm theme-text-on-hero-muted mt-1">Across all links</p>
        </HeroMetricCard>

        <HeroMetricCard
          label="Active Links"
          gradientFrom="var(--hero-active-from)"
          gradientTo="var(--hero-active-to)"
          icon={Link2}
          delay={0.1}
        >
          <p className="text-3xl sm:text-4xl font-bold theme-text-on-hero">
            <AnimatedCounter target={globalStats.activeLinks} duration={1} />
          </p>
          <p className="text-sm theme-text-on-hero-muted mt-1">Currently live</p>
        </HeroMetricCard>

        <HeroMetricCard
          label="Top Link"
          gradientFrom="var(--hero-top-from)"
          gradientTo="var(--hero-top-to)"
          icon={Trophy}
          delay={0.15}
        >
          <p className="text-xl sm:text-2xl font-bold theme-text-on-hero truncate">
            {globalStats.topLink?.shortCode || '—'}
          </p>
          <p className="text-sm theme-text-on-hero-muted mt-1">
            {(globalStats.topLink?.clickCount || 0).toLocaleString()} clicks
          </p>
        </HeroMetricCard>

        <HeroMetricCard
          label="Growth"
          gradientFrom={growthPositive ? 'var(--hero-growth-from)' : 'var(--hero-growth-down-from)'}
          gradientTo={growthPositive ? 'var(--hero-growth-to)' : 'var(--hero-growth-down-to)'}
          icon={growthPositive ? TrendingUp : TrendingDown}
          delay={0.2}
        >
          <p className="text-3xl sm:text-4xl font-bold theme-text-on-hero flex items-baseline gap-1">
            {growth.value > 0 ? '+' : ''}
            {growth.value}%
          </p>
          <p className="text-sm theme-text-on-hero-muted mt-1">{growth.label}</p>
          <p className="text-[10px] theme-text-on-hero-muted mt-1 opacity-80">
            {showingAllLinks ? 'All links' : 'Selected link'} · 7-day window
          </p>
        </HeroMetricCard>
      </div>

      {/* Link selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <label className="text-sm font-medium text-[var(--text-muted)] shrink-0">Detailed insights for</label>
        <select
          value={selectedUrlId || ''}
          onChange={(e) => {
            const nextUrlId = e.target.value;
            const nextUrl = urls.find((url) => url._id === nextUrlId);
            console.log('[Trends Select] URL selection changed', {
              urlId: nextUrlId,
              shortCode: nextUrl?.shortCode,
            });
            setSelectedUrlId(nextUrlId);
            setSearchParams(nextUrlId && nextUrlId !== 'all' ? { urlId: nextUrlId } : {});
          }}
          className="input-field max-w-xl"
        >
          <option value="all">All links</option>
          {urls.map((url) => (
            <option key={url._id} value={url._id}>
              {url.shortCode} — {url.originalUrl.substring(0, 48)}
            </option>
          ))}
        </select>
      </motion.div>

      {(analyticsLoading || trendsLoading) && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-11 w-11 border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      )}

      {(analyticsError || trendsError) && (
        <div className="glass-card p-6">
          <p className="text-[var(--text-primary)]">Failed to load analytics for this link.</p>
        </div>
      )}

      {!analyticsLoading && !trendsLoading && !analyticsError && !trendsError && (
        <>
          {/* Insight widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <InsightWidget
              icon={Globe}
              label="Most Active Browser"
              value={topBrowser?.name || '—'}
              sub={topBrowser ? `${topBrowser.count} visits` : 'No visit data'}
              delay={0.1}
            />
            <InsightWidget
              icon={Monitor}
              label="Most Active Device"
              value={topDevice?.name || '—'}
              sub={topDevice ? `${topDevice.count} visits` : 'No visit data'}
              delay={0.15}
            />
            <InsightWidget
              icon={Clock}
              label="Last Click Time"
              value={lastClickLabel}
              sub={showingAllLinks ? 'Across all links' : selectedUrl ? `On /${selectedUrl.shortCode}` : ''}
              delay={0.2}
            />
            <InsightWidget
              icon={Trophy}
              label="Top Performing Link"
              value={globalStats.topLink?.shortCode || '—'}
              sub={`${(globalStats.topLink?.clickCount || 0).toLocaleString()} total clicks`}
              delay={0.25}
            />
          </div>

          {/* Click trends */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ boxShadow: 'var(--shadow)' }}
            className="glass-card p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <TrendingUp className="text-[var(--accent)]" size={22} />
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Click Trends</h2>
                {trendChart.label && (
                  <span className="text-xs text-[var(--text-muted)] sm:ml-2">{trendChart.label}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Date range
                  </label>
                  <select
                    value={dateRangePreset}
                    onChange={(e) => setDateRangePreset(e.target.value)}
                    className="input-field text-sm w-full sm:w-auto min-w-[180px]"
                  >
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {dateRangePreset === 'custom' && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                        From date
                      </label>
                      <input
                        type="date"
                        value={customFrom}
                        max={customTo || todayKey}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                        To date
                      </label>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom}
                        max={todayKey}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="h-80 sm:h-96 w-full">
              {customRangeInvalid ? (
                <p className="text-center text-[var(--text-muted)] py-20">
                  Select a valid from and to date (from must be on or before to).
                </p>
              ) : chartData.length ? (
                <ResponsiveContainer
                  key={`trends-line-${themeId}-${dateRangePreset}-${customFrom}-${customTo}`}
                  width="100%"
                  height="100%"
                >
                  <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={28}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeOpacity: 0.25 }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      dot={{ fill: 'var(--bg-card)', stroke: 'var(--accent)', strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 7,
                        fill: 'var(--accent)',
                        stroke: 'var(--btn-on-accent)',
                        strokeWidth: 2,
                      }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-[var(--text-muted)] py-20">No click trend data for this period.</p>
              )}
            </div>
          </motion.div>

          {/* Device + Browser charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -2 }}
              className="glass-card p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="text-[var(--accent)]" size={20} />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Device Breakdown</h2>
              </div>
              <div className="h-72">
                {deviceData.length ? (
                  <ResponsiveContainer key={`device-${themeId}`} width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        paddingAngle={3}
                        animationDuration={800}
                        animationBegin={0}
                        activeIndex={activeDeviceIndex}
                        activeShape={{ outerRadius: 105 }}
                        onMouseEnter={(_, index) => setActiveDeviceIndex(index)}
                      >
                        {deviceData.map((entry) => (
                          <Cell key={entry.name} fill={DEVICE_COLORS[entry.name] || 'var(--chart-1)'} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-sm text-[var(--text-primary)]">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] text-center py-16">No device visits yet.</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {DEVICE_ORDER.map((name) => (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <DeviceIcon name={name} />
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -2 }}
              className="glass-card p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="text-[var(--accent)]" size={20} />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Browser Breakdown</h2>
              </div>
              <div className="h-72">
                {browserData.length ? (
                  <ResponsiveContainer key={`browser-${themeId}`} width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={browserData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                        animationDuration={900}
                        activeIndex={activeBrowserIndex}
                        activeShape={{ outerRadius: 100 }}
                        onMouseEnter={(_, index) => setActiveBrowserIndex(index)}
                      >
                        {browserData.map((entry) => (
                          <Cell key={entry.name} fill={BROWSER_COLORS[entry.name] || 'var(--chart-5)'} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-sm text-[var(--text-primary)]">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] text-center py-16">No browser visits yet.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Country chart + Top Referrers */}
          {!countryLoading && !referrerLoading && (countryChartData.length > 0 || (referrerBreakdown?.length > 0)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -2 }}
                className="glass-card p-5 sm:p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="text-[var(--accent)]" size={20} />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Country Breakdown</h2>
                </div>
                <div className="h-72">
                  {countryChartData.length ? (
                    <ResponsiveContainer key={`country-${themeId}`} width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          paddingAngle={2}
                          animationDuration={800}
                          activeIndex={activeCountryIndex}
                          activeShape={{ outerRadius: 105 }}
                          onMouseEnter={(_, index) => setActiveCountryIndex(index)}
                        >
                          {countryChartData.map((entry) => (
                            <Cell key={entry.name} fill={countryColors[entry.name] || 'var(--chart-1)'} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          formatter={(value) => (
                            <span className="text-sm text-[var(--text-primary)]">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] text-center py-16">No country data yet.</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ y: -2 }}
                className="glass-card p-5 sm:p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="text-[var(--accent)]" size={20} />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Referrers</h2>
                </div>
                {referrerBreakdown?.length ? (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="table-head-themed sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold">#</th>
                          <th className="text-left py-2 px-3 font-semibold">Referrer</th>
                          <th className="text-right py-2 px-3 font-semibold">Clicks</th>
                          <th className="text-right py-2 px-3 font-semibold">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrerBreakdown.slice(0, 20).map((item, index) => {
                          const total = referrerBreakdown.reduce((s, r) => s + r.count, 0);
                          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                          return (
                            <tr key={item.referrer} className="border-b border-[var(--border)]/60">
                              <td className="py-2 px-3 text-xs text-[var(--text-muted)]">{index + 1}</td>
                              <td className="py-2 px-3 truncate max-w-[200px]" title={item.referrer}>
                                {item.referrer === 'Direct' ? (
                                  <span className="font-medium">{item.referrer}</span>
                                ) : (
                                  <span className="text-link">{item.referrer}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold">{item.count}</td>
                              <td className="py-2 px-3 text-right text-xs text-[var(--text-muted)]">{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] text-center py-16">No referrer data yet.</p>
                )}
              </motion.div>
            </div>
          )}

          {/* Activity timeline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-[var(--accent)]" size={22} />
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Activity Timeline</h2>
            </div>

            {timelineItems.length ? (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--accent)] via-[var(--accent-muted)] to-transparent" />
                <ul className="space-y-0">
                  {timelineItems.map((item, i) => (
                    <motion.li
                      key={`${item.time}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ x: 4 }}
                      className="relative pl-10 py-4 border-b border-[var(--border)]/60 last:border-0"
                    >
                      <span className="absolute left-0 top-5 w-[22px] h-[22px] rounded-full bg-[var(--accent)] flex items-center justify-center ring-4 ring-[var(--accent-muted)]">
                        <span className="w-2 h-2 rounded-full theme-text-on-hero" style={{ backgroundColor: 'currentColor' }} />
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            <span className="text-[var(--accent)]">{item.browser}</span>
                            <span className="text-[var(--text-muted)] font-normal"> on </span>
                            <span>{item.device}</span>
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <Link2 size={12} />
                            /{item.link}
                          </p>
                        </div>
                        <time className="text-xs font-medium text-[var(--text-muted)] sm:text-right shrink-0">
                          {new Date(item.time).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                No activity recorded for this link yet. Clicks will appear here in real time.
              </p>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
