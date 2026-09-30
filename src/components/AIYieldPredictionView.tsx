import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { aiService } from '../../ai-service/services/ai.service';
import { YieldPrediction } from '../../shared/types';
import { 
  TrendingUp, 
  Scale, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface AIYieldPredictionViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AIYieldPredictionView: React.FC<AIYieldPredictionViewProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const { selectedHiveId, selectedHive, liveReading, readingHistory } = useApp();

  const [prediction, setPrediction] = useState<YieldPrediction | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    loadPrediction();
  }, [selectedHiveId, liveReading]);

  const loadPrediction = async () => {
    setIsCalculating(true);
    const currentWeight = liveReading?.weight || 46.8;
    const result = await aiService.predictYield(selectedHiveId, currentWeight, readingHistory);
    setPrediction(result);
    setIsCalculating(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-[#7A4B24]" />
          <span>{t('ai.yieldBadge')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
          {t('ai.yieldTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          {t('ai.yieldSubtitle')}
        </p>
      </div>

      {prediction && (
        <div className="space-y-6">
          {/* Main Yield Metric Card */}
          <div className="bg-[#7A4B24] rounded-3xl text-white p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#F4C542] uppercase tracking-wider font-semibold block">
                  {t('ai.projectedSurplus')} · {t('common.box')} {selectedHive?.boxNumber || 'H024'}
                </span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl sm:text-5xl font-bold font-mono">
                    {prediction.estimatedYieldKg}
                  </span>
                  <span className="text-xl text-white/90 font-serif"> {t('common.kg')} {t('ai.rawHoneyUnit')}</span>
                </div>
                <p className="text-xs text-white/70 mt-2 font-mono">
                  {t('ai.confidenceInterval')} {prediction.confidenceRange.min} {t('common.kg')} — {prediction.confidenceRange.max} {t('common.kg')}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center sm:text-right">
                <span className="text-xs text-[#F4C542] block">{t('ai.optimalWindow')}</span>
                <span className="text-2xl font-bold font-serif text-white mt-1 block">
                  {prediction.daysToOptimalHarvest} {t('ai.daysUnit')}
                </span>
                <span className="text-[11px] text-white/70 block mt-1">
                  {t('ai.targetCapped')}
                </span>
              </div>
            </div>
          </div>

          {/* Contributing Analytics Factors */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              {t('ai.signalsTitle')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-stone-400 block text-[11px]">{t('ai.weightVelocity')}</span>
                <span className="text-base font-bold font-mono text-stone-900 mt-1 block">
                  {prediction.factors.weightAccumulationRate}
                </span>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {t('ai.scaleRegression')}
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-stone-400 block text-[11px]">{t('ai.floweringSeasonScore')}</span>
                <span className="text-base font-bold text-stone-900 mt-1 block">
                  {prediction.factors.floweringSeasonScore}
                </span>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {t('ai.regionalPhenology')}
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                <span className="text-stone-400 block text-[11px]">{t('ai.colonyPopulation')}</span>
                <span className="text-base font-bold text-stone-900 mt-1 block">
                  {prediction.factors.colonyStrength}
                </span>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {t('ai.populationFootprint')}
                </span>
              </div>
            </div>

            {/* Harvest Preparation Checklist */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-semibold text-stone-800 mb-3">
                {t('ai.checklistTitle')}
              </h4>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{t('ai.checkItem1')}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{t('ai.checkItem2')}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{t('ai.checkItem3')}</span>
                </div>
              </div>
            </div>

            {/* Action Button: Create Honey Batch */}
            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => onNavigateTab('batches')}
                className="px-5 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>{t('ai.recordHarvestMintBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
