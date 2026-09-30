import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  firestoreIdentityService,
  AdminSystemStats,
  LightweightBeekeeperSummary,
} from '../services/firestore';
import {
  getAdminSystemStats,
  getAdminBeekeepers,
} from '../services/api';
import {
  Building2,
  Users,
  Layers,
  MapPin,
  ShieldCheck,
  LifeBuoy,
  BookOpen,
  ShoppingBag,
  AlertTriangle,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';


interface AdminClusterViewProps {
  onNavigateTab: (tab: string, extraId?: string) => void;
  initialSection?: 'overview' | 'beekeepers';
}

export const AdminClusterView: React.FC<AdminClusterViewProps> = ({
  onNavigateTab,
  initialSection = 'overview',
}) => {
  const { t } = useLanguage();

  // Navigation State inside Admin
  const [activeSection, setActiveSection] = useState<'overview' | 'beekeepers'>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // 1. Lightweight Aggregate System Statistics (Dashboard Startup)
  const [stats, setStats] = useState<AdminSystemStats>({
    registeredBeekeepers: 0,
    activeApiaries: 0,
    registeredHives: 0,
    honeyBatches: 0,
    tickets: { open: 0, inReview: 0, resolved: 0, total: 0 },
    publishedLearning: 0,
    marketplace: { activeListings: 0, totalOrders: 0, pendingOrders: 0 },
    activeAlertsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getAdminSystemStats();
      setStats(data);
    } catch (err) {
      console.warn('Could not fetch aggregate admin stats from Express API:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. Beekeepers Directory (Loaded only on demand when viewing beekeepers via Express API)
  const [beekeepersList, setBeekeepersList] = useState<LightweightBeekeeperSummary[]>([]);
  const [loadingBeekeepers, setLoadingBeekeepers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBeekeepers = async () => {
    if (beekeepersList.length > 0) return;
    setLoadingBeekeepers(true);
    try {
      const list = await getAdminBeekeepers();
      setBeekeepersList(list);
    } catch (err) {
      console.warn('Could not load beekeepers list from Express API:', err);
    } finally {
      setLoadingBeekeepers(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'beekeepers') {
      fetchBeekeepers();
    }
  }, [activeSection]);

  // Filtered beekeepers
  const filteredBeekeepers = beekeepersList.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.beekeeperId.toLowerCase().includes(q) ||
      b.district.toLowerCase().includes(q) ||
      b.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Institutional Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('admin.portalBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('admin.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t('admin.subtitle')}
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-[#7A4B24] text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {t('admin.overviewTab')}
          </button>
          <button
            onClick={() => setActiveSection('beekeepers')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeSection === 'beekeepers'
                ? 'bg-[#7A4B24] text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {t('admin.beekeepersTab')}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SYSTEM OVERVIEW (AGGREGATED SYSTEM-LEVEL INFORMATION ONLY)     */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* Primary Statistics: The 4 Core Aggregate Metrics */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                National Honey Mission Ecosystem Metrics
              </span>
              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Refresh aggregate metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Registered Beekeepers */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs text-stone-600 font-semibold">{t('admin.registeredBeekeepers')}</span>
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-bold font-mono text-stone-900 mt-2">
                  {loadingStats ? '...' : stats.registeredBeekeepers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-500">{t('admin.beekeepersSubtext')}</span>
                  <button
                    onClick={() => setActiveSection('beekeepers')}
                    className="text-[11px] font-semibold text-[#7A4B24] hover:text-[#5A3418] cursor-pointer"
                  >
                    Directory →
                  </button>
                </div>
              </div>

              {/* Stat 2: Active Apiaries */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs text-stone-600 font-semibold">{t('admin.activeApiaries')}</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold font-mono text-stone-900 mt-2">
                  {loadingStats ? '...' : stats.activeApiaries.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-500">{t('admin.apiariesSubtext')}</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-medium">GPS Geotagged</span>
                </div>
              </div>

              {/* Stat 3: Registered Hives */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs text-stone-600 font-semibold">{t('admin.registeredHives')}</span>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-bold font-mono text-stone-900 mt-2">
                  {loadingStats ? '...' : stats.registeredHives.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-500">{t('admin.hivesSubtext')}</span>
                  <span className="text-[10px] text-stone-400 font-mono">Digital Identity</span>
                </div>
              </div>

              {/* Stat 4: Honey Batches */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs text-stone-600 font-semibold">{t('admin.honeyBatches')}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold font-mono text-stone-900 mt-2">
                  {loadingStats ? '...' : stats.honeyBatches.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-500">{t('admin.batchesSubtext')}</span>
                  <button
                    onClick={() => onNavigateTab('batches')}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    Ledger →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Attention Banner if open tickets exist */}
          {stats.tickets.open > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{t('admin.attentionRequired')}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-stone-600 mt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      {stats.tickets.open} {t('admin.openCount')} Tickets ({t('admin.openTicketsAlert')})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('tickets')}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  {t('admin.reviewDeskLink')}
                </button>
              </div>
            </div>
          )}

          {/* Secondary Administrative Modules: Support Tickets, Learning, Marketplace */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Module 1: Support Tickets */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-stone-900 font-serif">{t('admin.ticketsTitle')}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                    {stats.tickets.total}
                  </span>
                </div>

                <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                  {t('admin.ticketsSubtext')}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center font-mono">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-sans uppercase font-medium">
                      {t('admin.openCount')}
                    </span>
                    <span className="text-lg font-bold text-amber-700 block mt-0.5">
                      {stats.tickets.open}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-sans uppercase font-medium">
                      {t('admin.inReviewCount')}
                    </span>
                    <span className="text-lg font-bold text-stone-800 block mt-0.5">
                      {stats.tickets.inReview}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-sans uppercase font-medium">
                      {t('admin.resolvedCount')}
                    </span>
                    <span className="text-lg font-bold text-emerald-700 block mt-0.5">
                      {stats.tickets.resolved}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('tickets')}
                className="w-full mt-6 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('admin.viewTicketsBtn')}</span>
              </button>
            </div>

            {/* Module 2: Learning Hub Management */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-stone-900 font-serif">{t('admin.learningTitle')}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                    {stats.publishedLearning}
                  </span>
                </div>

                <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                  {t('admin.learningSubtext')}
                </p>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 mt-4">
                  <span className="text-xs text-amber-900 font-semibold block">{t('admin.publishedGuidesCount')}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-950">{stats.publishedLearning}</span>
                    <span className="text-[11px] text-amber-800">training modules active in Firestore</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <button
                  onClick={() => onNavigateTab('learning')}
                  className="flex-1 px-3 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{t('admin.manageLearningBtn')}</span>
                </button>
                <button
                  onClick={() => onNavigateTab('learning')}
                  className="px-3 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {t('admin.publishNewBtn')}
                </button>
              </div>
            </div>

            {/* Module 3: Marketplace Overview */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-stone-900 font-serif">{t('admin.marketplaceTitle')}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {stats.marketplace.activeListings}
                  </span>
                </div>

                <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                  {t('admin.marketplaceSubtext')}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 font-mono">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-sans">{t('admin.activeListingsCount')}</span>
                    <span className="text-xl font-bold text-stone-900 block mt-1">
                      {stats.marketplace.activeListings}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-sans">{t('admin.totalInquiriesCount')}</span>
                    <span className="text-xl font-bold text-emerald-700 block mt-1">
                      {stats.marketplace.totalOrders}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('marketplace')}
                className="w-full mt-6 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('admin.viewMarketplaceBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SCALABLE BEEKEEPERS DIRECTORY                                 */}
      {/* ========================================================================= */}
      {activeSection === 'beekeepers' && (
        <div className="space-y-6">
          {/* Header Navigation Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 text-xs">
            <div className="flex items-center gap-2 text-stone-600 font-semibold">
              <Users className="w-4 h-4 text-amber-600" />
              <span>{t('admin.beekeepersDirectoryTitle')}</span>
            </div>
            <button
              onClick={() => setActiveSection('overview')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              {t('admin.backToOverview')}
            </button>
          </div>

          {/* Lightweight Beekeepers List (Table) */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold font-serif text-stone-900">
                  {t('admin.beekeepersDirectoryTitle')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('admin.beekeepersDirectoryDesc')}
                </p>
              </div>

              {/* Real-time search filter */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {loadingBeekeepers ? (
              <div className="p-12 text-center text-xs text-stone-400">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-amber-600" />
                <span>Loading directory from Firestore...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">{t('admin.colBeekeeperId')}</th>
                      <th className="px-6 py-3">{t('admin.colName')}</th>
                      <th className="px-6 py-3">{t('admin.colLocation')}</th>
                      <th className="px-6 py-3">{t('admin.colApiaries')}</th>
                      <th className="px-6 py-3">{t('admin.colHives')}</th>
                      <th className="px-6 py-3">{t('admin.colKvicReg')}</th>
                      <th className="px-6 py-3">{t('admin.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredBeekeepers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-stone-400">
                          {t('admin.noBeekeepersFound')}
                        </td>
                      </tr>
                    ) : (
                      filteredBeekeepers.map((bk) => (
                        <tr key={bk.beekeeperId} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-stone-900">{bk.beekeeperId}</td>
                          <td className="px-6 py-4 font-medium text-stone-900">{bk.name}</td>
                          <td className="px-6 py-4 text-stone-600">{bk.village}, {bk.district} ({bk.state})</td>
                          <td className="px-6 py-4 font-mono">{bk.totalApiaries}</td>
                          <td className="px-6 py-4 font-mono">{bk.totalHives}</td>
                          <td className="px-6 py-4 font-mono text-stone-500">{bk.kvicRegistrationNumber}</td>
                          <td className="px-6 py-4">
                            <span className="text-emerald-800 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                              {bk.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

