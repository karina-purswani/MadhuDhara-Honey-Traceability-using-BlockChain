import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { SimulationScenario } from '../../iot/simulator/hive_simulator';
import { translationService } from '../services/translation.service';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpRight, 
  Radio, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenTicketWithAlert?: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onOpenTicketWithAlert }) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { 
    hives, 
    selectedHiveId, 
    setSelectedHiveId, 
    selectedHive, 
    liveReading, 
    simulationScenario, 
    setSimulationScenario, 
    alerts, 
    batches 
  } = useApp();

  const [isSimulating, setIsSimulating] = useState(false);

  // Active alerts count
  const unhandledAlerts = alerts.filter((a) => !a.isAcknowledged);

  // Scenarios list with reactive translation
  const scenarios: { id: SimulationScenario; label: string; desc: string }[] = [
    { 
      id: 'OPTIMAL_FLOW', 
      label: t('dashboard.scenarios.optimalFlow'), 
      desc: t('dashboard.scenarios.optimalFlowDesc') 
    },
    { 
      id: 'HEAT_STRESS', 
      label: t('dashboard.scenarios.heatStress'), 
      desc: t('dashboard.scenarios.heatStressDesc') 
    },
    { 
      id: 'SWARMING_WEIGHT_DROP', 
      label: t('dashboard.scenarios.swarmingDrop'), 
      desc: t('dashboard.scenarios.swarmingDropDesc') 
    },
    { 
      id: 'HUMIDITY_ALERT', 
      label: t('dashboard.scenarios.humidityAlert'), 
      desc: t('dashboard.scenarios.humidityAlertDesc') 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-[#7A4B24] rounded-2xl text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542] text-[#25211D] font-bold text-[11px] uppercase">
                {t('dashboard.partnerBadge')}
              </span>
              <span className="text-white/70">ID: {(currentUser as any)?.beekeeperId || 'BK-MH-NAS-0129'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-2">
              {t('dashboard.welcomeBack')} {currentUser?.name || 'Ramesh Patil'}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
              {(currentUser as any)?.village || 'Dindori'}, {(currentUser as any)?.district || 'Nashik'} ({(currentUser as any)?.state || 'Maharashtra'}) · {hives.length} {t('dashboard.subLocation')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('hives')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('dashboard.quickPassportBtn')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="px-4 py-2 bg-[#F4C542] hover:bg-[#e5b736] text-[#25211D] font-semibold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#25211D]" />
              <span>{t('dashboard.quickAlertsBtn')} ({unhandledAlerts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (No static pills!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 block font-medium">{t('dashboard.kpiRegisteredHives')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">{hives.length}</span>
            <span className="text-xs text-stone-500">{t('dashboard.kpiBoxesActive')}</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-2 block font-medium">
            {t('dashboard.kpiIotEquipped')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 block font-medium">{t('dashboard.kpiColonyHealth')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">
              {selectedHive?.currentHealthScore || 88}%
            </span>
            <span className="text-xs text-emerald-600">{t('dashboard.kpiHealthStable')}</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {t('dashboard.kpiHealthDerived')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 block font-medium">{t('dashboard.kpiSeasonHarvest')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">142.8</span>
            <span className="text-xs text-stone-500">{t('dashboard.kpiHarvestTotal')}</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block font-mono">
            {batches.length} {t('dashboard.kpiBatchesMinted')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 block font-medium">{t('dashboard.kpiIotAlerts')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700">
              {unhandledAlerts.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">{t('dashboard.kpiNeedsAttention')}</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {t('dashboard.kpiAlertsDetail')}
          </span>
        </div>
      </div>

      {/* Main Grid: Live Hive Telemetry & Simulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live IoT Telemetry Box */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  {t('dashboard.liveTelemetryTitle')}
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <span>{t('common.esp32Node', { id: selectedHive?.iotDeviceId || '9901' })}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">{t('dashboard.streamingStatus')}</span>
                </div>
              </div>
            </div>

            {/* Hive Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 font-medium">{t('dashboard.selectHiveLabel')}</label>
              <select
                value={selectedHiveId}
                onChange={(e) => setSelectedHiveId(e.target.value)}
                className="text-xs font-mono font-semibold bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#7A4B24] focus:border-[#7A4B24]"
              >
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>
                    {t('common.box')} {h.boxNumber} ({t(h.status)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetry Sensor Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {/* Temperature */}
            <div className={`p-4 rounded-xl border ${
              (liveReading?.temperature || 34.6) > 37.0 
                ? 'bg-rose-50/60 border-rose-200' 
                : 'bg-stone-50 border-stone-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">{t('dashboard.broodTemp')}</span>
                <Thermometer className={`w-4 h-4 ${
                  (liveReading?.temperature || 34.6) > 37.0 ? 'text-rose-600' : 'text-[#8B5E34]'
                }`} />
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 mt-2">
                {liveReading?.temperature || 34.6}°C
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block">
                {t('dashboard.tempOptimum')}
              </span>
            </div>

            {/* Humidity */}
            <div className={`p-4 rounded-xl border ${
              (liveReading?.humidity || 57) > 70 
                ? 'bg-amber-50/60 border-amber-200' 
                : 'bg-stone-50 border-stone-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">{t('dashboard.humidity')}</span>
                <Droplets className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 mt-2">
                {liveReading?.humidity || 57}%
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block">
                {t('dashboard.humidityOptimum')}
              </span>
            </div>

            {/* Weight */}
            <div className="p-4 rounded-xl border bg-stone-50 border-stone-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">{t('dashboard.hiveWeight')}</span>
                <Scale className="w-4 h-4 text-stone-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 mt-2">
                {liveReading?.weight || 46.8} kg
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block">
                {t('dashboard.weightSensor')}
              </span>
            </div>

            {/* Activity */}
            <div className="p-4 rounded-xl border bg-stone-50 border-stone-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">{t('dashboard.activitySound')}</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold capitalize text-stone-900 mt-2">
                {liveReading?.activityLevel || 'normal'}
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block font-mono">
                {liveReading?.acousticFrequencyHz || 450} Hz
              </span>
            </div>
          </div>

          {/* Interactive IoT Simulation Sandbox Switcher */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <Cpu className="w-3.5 h-3.5 text-[#7A4B24]" />
                <span>{t('dashboard.simulatorTitle')}</span>
              </div>
              <span className="text-[11px] text-stone-400">
                {t('dashboard.simulatorActive')} <strong className="text-stone-700 font-mono">{simulationScenario}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setSimulationScenario(sc.id)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                    simulationScenario === sc.id
                      ? 'bg-[#FFF8E7] border-[#7A4B24] text-[#7A4B24] font-semibold shadow-2xs'
                      : 'bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="block font-medium truncate">{sc.label}</span>
                  <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">{sc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Smart Decision & AI Quick Actions */}
        <div className="space-y-6">
          {/* AI Decision Support Box */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D99A24]" />
              <h3 className="text-base font-bold font-serif text-stone-900">
                {t('dashboard.aiDecisionTitle')}
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {t('dashboard.aiDecisionDesc')}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigateTab('ai-disease')}
                className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-[#D99A24]/40 hover:bg-[#FFF8E7] transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-stone-900 block">{t('dashboard.aiToolDiseaseTitle')}</span>
                  <span className="text-stone-500 text-[11px]">{t('dashboard.aiToolDiseaseDesc')}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigateTab('ai-yield')}
                className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-[#D99A24]/40 hover:bg-[#FFF8E7] transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-stone-900 block">{t('dashboard.aiToolYieldTitle')}</span>
                  <span className="text-stone-500 text-[11px]">{t('dashboard.aiToolYieldDesc')}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigateTab('profit')}
                className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-[#D99A24]/40 hover:bg-[#FFF8E7] transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-stone-900 block">{t('dashboard.aiToolProfitTitle')}</span>
                  <span className="text-stone-500 text-[11px]">{t('dashboard.aiToolProfitDesc')}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>

          {/* Quick Active Alerts Box */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  {t('dashboard.criticalAlertsTitle')} ({unhandledAlerts.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-[#7A4B24] hover:underline font-medium cursor-pointer"
              >
                {t('dashboard.viewAllAlerts')}
              </button>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 2).map((alt) => {
                const localizedAlt = translationService.getLocalizedData(alt, language);
                const altHive = hives.find((h) => h.id === alt.hiveId);
                const boxLabel = altHive ? `${t('common.box')} ${altHive.boxNumber}` : `${t('common.box')} ${alt.hiveId.slice(-4)}`;
                return (
                  <div
                    key={alt.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 font-serif">{localizedAlt.title}</span>
                      <span className="text-[10px] text-stone-500">{boxLabel}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 line-clamp-2">
                      {localizedAlt.message}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-stone-700 font-semibold">
                        {t('dashboard.observedValueLabel')} {alt.observedValue}
                      </span>
                      <button
                        onClick={() => {
                          if (onOpenTicketWithAlert) onOpenTicketWithAlert(alt.id);
                          onNavigateTab('tickets');
                        }}
                        className="px-2.5 py-1 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {t('dashboard.raiseTicketBtn')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
