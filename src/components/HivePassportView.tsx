import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Hive } from '../../shared/types';
import { mockDb } from '../../backend/src/repositories/mock.db';
import { aiService } from '../../ai-service/services/ai.service';
import { translationService } from '../services/translation.service';
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  MapPin, 
  Scale, 
  Thermometer, 
  Activity, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';

interface HivePassportViewProps {
  onNavigateTab: (tab: string) => void;
}

export const HivePassportView: React.FC<HivePassportViewProps> = ({ onNavigateTab }) => {
  const { t, language } = useLanguage();
  const { hives, selectedHiveId, setSelectedHiveId, liveReading, readingHistory, batches, alerts } = useApp();

  const currentHive = hives.find((h) => h.id === selectedHiveId) || hives[0];
  const beekeeperInfo = currentHive ? mockDb.beekeepers.get(currentHive.beekeeperId) : null;
  const apiaryInfo = currentHive ? mockDb.apiaries.get(currentHive.apiaryId) : null;

  // Dynamic health calculation
  const healthBreakdown = liveReading 
    ? aiService.calculateHealthScore(liveReading)
    : {
        overallScore: currentHive?.currentHealthScore || 88,
        temperatureScore: 85,
        humidityScore: 90,
        weightTrendScore: 88,
        activityScore: 92,
        status: currentHive?.status || 'healthy',
        trend: 'stable' as const,
        factors: ['Optimal brood temperature maintained', 'Normal nectar accumulation'],
      };

  // Associated batches with this hive
  const associatedBatches = batches.filter((b) => b.hiveIds.includes(currentHive?.id || ''));

  // Alerts for this hive
  const hiveAlerts = alerts.filter((a) => a.hiveId === currentHive?.id);

  if (!currentHive) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-500">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Hive Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <Award className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('hives.registryBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('hives.title')}
          </h1>
          <p className="text-xs sm:text-stone-500 mt-0.5">
            {t('hives.subtitle')}
          </p>
        </div>

        {/* Switch Hive Box */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-600">{t('hives.selectBoxLabel')}</label>
          <select
            value={selectedHiveId}
            onChange={(e) => setSelectedHiveId(e.target.value)}
            className="text-xs font-mono font-semibold bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24] shadow-xs"
          >
            {hives.map((h) => (
              <option key={h.id} value={h.id}>
                {t('common.box')} {h.boxNumber} · {h.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* The Visual "Hive Passport" Certificate Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        {/* Decorative Watermark Seal */}
        <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-stone-900" />
        </div>

        {/* Passport Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#7A4B24] rounded-2xl flex items-center justify-center text-white shadow-xs font-serif font-bold text-2xl">
              {currentHive.boxNumber}
            </div>
            <div>
              <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest block">
                {t('hives.officialPassport')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
                {currentHive.id}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-stone-500 block">{t('hives.healthIndex')}</span>
              <span className="text-2xl font-bold font-mono text-[#7A4B24]">
                {healthBreakdown.overallScore}%
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              currentHive.status === 'healthy' 
                ? 'bg-emerald-100 text-emerald-800' 
                : currentHive.status === 'attention'
                ? 'bg-[#FFF8E7] text-[#9A670D] border border-[#F4C542]'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {t(currentHive.status)}
            </div>
          </div>
        </div>

        {/* Passport Specification Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-stone-100 text-xs">
          <div>
            <span className="text-stone-400 block font-medium">{t('hives.beekeeperLabel')}</span>
            <p className="font-semibold text-stone-900 mt-1">{beekeeperInfo?.name || 'Ramesh Patil'}</p>
            <span className="text-[10px] text-stone-500 font-mono">{currentHive.beekeeperId}</span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.apiaryLocationLabel')}</span>
            <p className="font-semibold text-stone-900 mt-1">{apiaryInfo?.name || 'Sahyadri Flora Apiary'}</p>
            <span className="text-[10px] text-stone-500">{apiaryInfo?.locationName || 'Dindori, Nashik (MH)'}</span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.beeSpeciesLabel')}</span>
            <p className="font-semibold text-stone-900 mt-1 italic">{currentHive.beeSpecies}</p>
            <span className="text-[10px] text-stone-500">{t('hives.speciesSubtext')}</span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.queenAgeLabel')}</span>
            <p className="font-semibold text-stone-900 mt-1">{currentHive.queenAgeMonths} {t('hives.months')}</p>
            <span className="text-[10px] text-stone-500">{t('hives.queenInstalled')} {currentHive.installationDate}</span>
          </div>
        </div>

        {/* Passport Second Row: IoT Hardware & Lifetime Production */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-stone-100 text-xs">
          <div>
            <span className="text-stone-400 block font-medium">{t('hives.iotUnitLabel')}</span>
            <p className="font-mono text-stone-900 font-semibold mt-1">
              {currentHive.iotDeviceId || 'ESP32-9901'}
            </p>
            <span className="text-[10px] text-emerald-700 font-medium">
              {currentHive.batteryLevel || 94}% {t('hives.batterySolar')}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.lifetimeYieldLabel')}</span>
            <p className="font-mono text-stone-900 font-bold text-sm mt-1">
              {currentHive.lifetimeHoneyYieldKg} {t('common.kg')}
            </p>
            <span className="text-[10px] text-stone-500">{currentHive.totalHarvestsCount} {t('hives.successfulHarvests')}</span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.lastInspectionLabel')}</span>
            <p className="font-semibold text-stone-900 mt-1">{currentHive.lastInspectionDate}</p>
            <span className="text-[10px] text-stone-500">{t('hives.inspectionStandard')}</span>
          </div>

          <div>
            <span className="text-stone-400 block font-medium">{t('hives.blockchainStatusLabel')}</span>
            <p className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('hives.identityAnchored')}
            </p>
            <span className="text-[10px] text-stone-400 font-mono truncate block">
              {t('common.blockNumber', { number: 18492040 })}
            </span>
          </div>
        </div>

        {/* Health Score Calculation Breakdown (Transparent & Explainable) */}
        <div className="mt-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              {t('hives.healthBreakdownTitle')}
            </h3>
            <span className="text-xs text-stone-500">
              {t('hives.trajectoryLabel')} <strong className="text-stone-800 capitalize">{healthBreakdown.trend}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
              <div className="flex justify-between text-stone-500 mb-1">
                <span>{t('hives.thermalStability')}</span>
                <span className="font-mono font-semibold text-stone-800">{healthBreakdown.temperatureScore}%</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${healthBreakdown.temperatureScore > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${healthBreakdown.temperatureScore}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
              <div className="flex justify-between text-stone-500 mb-1">
                <span>{t('hives.humidityBalance')}</span>
                <span className="font-mono font-semibold text-stone-800">{healthBreakdown.humidityScore}%</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500" 
                  style={{ width: `${healthBreakdown.humidityScore}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
              <div className="flex justify-between text-stone-500 mb-1">
                <span>{t('hives.weightTrajectory')}</span>
                <span className="font-mono font-semibold text-stone-800">{healthBreakdown.weightTrendScore}%</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${healthBreakdown.weightTrendScore}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
              <div className="flex justify-between text-stone-500 mb-1">
                <span>{t('hives.acousticFrequency')}</span>
                <span className="font-mono font-semibold text-stone-800">{healthBreakdown.activityScore}%</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-700" 
                  style={{ width: `${healthBreakdown.activityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Health Contributing Factors */}
          <div className="mt-3 p-3 bg-stone-50/80 rounded-xl border border-stone-200/60 text-xs text-stone-600">
            <span className="font-semibold text-stone-800 block mb-1">{t('hives.observationsTitle')}</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {healthBreakdown.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 12-Hour Historical Sparkline Trend */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-700 block mb-3">
            {t('hives.hourlyTelemetryTitle')}
          </span>

          <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center min-w-[500px]">
              {readingHistory.slice(-12).map((item, idx) => (
                <div key={item.id || idx} className="p-2 bg-stone-800/80 rounded border border-stone-700">
                  <span className="text-[10px] text-stone-400 block">
                    -{12 - idx}h
                  </span>
                  <span className={`block font-bold mt-1 ${item.temperature > 37 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {item.temperature}°C
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {item.weight}{t('common.kg')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Associated Honey Batches */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-700">
              {t('hives.associatedBatchesTitle')} ({associatedBatches.length})
            </span>
            <button
              onClick={() => onNavigateTab('batches')}
              className="text-xs text-[#7A4B24] hover:underline font-medium cursor-pointer"
            >
              {t('hives.viewAllBatches')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {associatedBatches.map((batch) => {
              const localizedBatch = translationService.getLocalizedData(batch, language);
              return (
                <div
                  key={batch.id}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-stone-900 block">{batch.id}</span>
                    <span className="text-stone-500 text-[11px]">{localizedBatch.productName} · {t('hives.harvestedOn')} {batch.harvestDate}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('verify')}
                    className="px-2.5 py-1 text-xs bg-white border border-stone-200 rounded font-medium text-stone-700 hover:bg-stone-100"
                  >
                    {t('hives.verifyBtn')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
