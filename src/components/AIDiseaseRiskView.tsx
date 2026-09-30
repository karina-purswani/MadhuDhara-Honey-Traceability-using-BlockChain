import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { aiService } from '../../ai-service/services/ai.service';
import { DiseaseAssessment } from '../../shared/types';
import { 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  Image as ImageIcon,
  ArrowRight,
  Info
} from 'lucide-react';

interface AIDiseaseRiskViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AIDiseaseRiskView: React.FC<AIDiseaseRiskViewProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const { selectedHiveId, selectedHive, liveReading } = useApp();

  const [selectedSample, setSelectedSample] = useState<string>('varroa_sample');
  const [beekeeperNotes, setBeekeeperNotes] = useState<string>('');
  const [assessment, setAssessment] = useState<DiseaseAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const sampleCombImages = [
    {
      id: 'varroa_sample',
      title: t('ai.sampleVarroaTitle'),
      desc: t('ai.sampleVarroaDesc'),
      hint: t('ai.sampleVarroaHint'),
    },
    {
      id: 'heat_stress_sample',
      title: t('ai.sampleHeatTitle'),
      desc: t('ai.sampleHeatDesc'),
      hint: t('ai.sampleHeatHint'),
    },
    {
      id: 'healthy_sample',
      title: t('ai.sampleHealthyTitle'),
      desc: t('ai.sampleHealthyDesc'),
      hint: t('ai.sampleHealthyHint'),
    },
  ];

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate inference
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = await aiService.assessDiseaseRisk(
      selectedHiveId,
      'BK-MH-NAS-0129',
      selectedSample,
      beekeeperNotes || 'Observed brood frame status',
      liveReading || undefined
    );

    setAssessment(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#7A4B24]" />
          <span>{t('ai.diseaseBadge')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
          {t('ai.diseaseTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
          {t('ai.diseaseSubtitle')}
        </p>
      </div>

      {/* Input Selection Form */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            {t('ai.step1SelectPhoto')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleCombImages.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => setSelectedSample(sample.id)}
                className={`text-left p-3.5 rounded-xl border text-xs transition-colors flex flex-col justify-between cursor-pointer ${
                  selectedSample === sample.id
                    ? 'border-[#7A4B24] bg-[#FFF8E7] shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <ImageIcon className="w-4 h-4 text-[#7A4B24]" />
                    {selectedSample === sample.id && (
                      <span className="text-[10px] text-[#7A4B24] font-bold">{t('ai.selectedBadge')}</span>
                    )}
                  </div>
                  <span className="font-semibold text-stone-900 block">{sample.title}</span>
                  <p className="text-[11px] text-stone-500 mt-1">{sample.desc}</p>
                </div>
                <span className="text-[10px] text-stone-400 font-medium mt-3 block">
                  {sample.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Beekeeper Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            {t('ai.step2Notes')}
          </label>
          <textarea
            rows={3}
            value={beekeeperNotes}
            onChange={(e) => setBeekeeperNotes(e.target.value)}
            placeholder={t('ai.notesPlaceholder')}
            className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
          />
        </div>

        {/* Telemetry Integration Indicator */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-600">
              {t('ai.liveTelemetryFused')} <strong>{liveReading?.temperature || 34.6}°C</strong>, <strong>{liveReading?.humidity || 57}% RH</strong>, <strong>{liveReading?.weight || 46.8}{t('common.kg')}</strong>
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">{t('common.box')} {selectedHive?.boxNumber || 'H023'}</span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="w-full py-3 bg-[#7A4B24] hover:bg-[#5A3418] text-white font-medium rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAnalyzing ? t('ai.screeningInProgress') : t('ai.runRiskAnalysisBtn')}</span>
        </button>
      </div>

      {/* AI Assessment Results Card */}
      {assessment && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-widest font-semibold block">
                {t('ai.assessmentIdLabel')} {assessment.id}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-0.5">
                {assessment.suspectedCondition}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-stone-500 block">{t('ai.modelConfidence')}</span>
                <span className="text-xl font-bold font-mono text-stone-900">
                  {assessment.confidencePercentage}%
                </span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800'
                  : assessment.riskLevel === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {assessment.riskLevel} {t('ai.riskSuffix')}
              </div>
            </div>
          </div>

          {/* Supporting Factors */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              {t('ai.detectedFactorsTitle')}
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100">
              {assessment.supportingFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Next Steps */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              {t('ai.recommendedStepsTitle')}
            </h3>
            <div className="space-y-2">
              {assessment.recommendedSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs text-stone-800 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Advisory Disclaimer */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t('ai.advisoryDisclaimerTitle')}</strong> {t('ai.advisoryDisclaimerDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
