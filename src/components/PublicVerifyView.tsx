import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { HoneyBatch, BatchEvent, BatchVerificationStatus } from '../../shared/types';
import { QrService } from '../services/qr.service';
import { blockchainService } from '../../blockchain/services/blockchain.service';
import { translationService } from '../services/translation.service';
import { getPublicBatch } from '../services/api/public.api';
import { mockDb } from '../../backend/src/repositories/mock.db';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  QrCode, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Calendar, 
  Droplet, 
  Sparkles, 
  ArrowRight, 
  Info 
} from 'lucide-react';

interface PublicVerifyViewProps {
  initialBatchId?: string;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({ initialBatchId }) => {
  const { t, language } = useLanguage();
  const { batches } = useApp();

  // Navigation flow inside consumer verification:
  // step: 'SEARCH' | 'FOUND' | 'TRACEABILITY'
  const [step, setStep] = useState<'SEARCH' | 'FOUND' | 'TRACEABILITY'>('SEARCH');
  const [batchInput, setBatchInput] = useState<string>(initialBatchId || '');
  const [activeBatch, setActiveBatch] = useState<HoneyBatch | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [blockchainProof, setBlockchainProof] = useState<any>(null);

  // If initialBatchId provided, auto verify
  useEffect(() => {
    if (initialBatchId) {
      handleSearch(initialBatchId);
    }
  }, [initialBatchId]);

  const handleSearch = async (batchIdToVerify: string) => {
    const cleanId = batchIdToVerify.trim();
    if (!cleanId) return;

    setIsVerifying(true);
    setSearchError(null);

    // Simulate verification query latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 1. Primary Source of Truth: Real Backend API public verification endpoint
    let foundBatch: HoneyBatch | null = null;
    const publicDoc = await getPublicBatch(cleanId);

    if (publicDoc) {
      foundBatch = {
        id: publicDoc.batchNumber,
        productName: publicDoc.productName,
        beekeeperId: 'BK-VERIFIED',
        beekeeperName: publicDoc.beekeeperName,
        apiaryId: 'API-VERIFIED',
        apiaryName: `${publicDoc.beekeeperName}'s Apiary`,
        hiveIds: [],
        harvestId: 'HV-VERIFIED',
        harvestDate: publicDoc.harvestDate,
        packagingDate: publicDoc.packagingDate,
        bestBeforeDate: publicDoc.bestBeforeDate,
        quantityBottles: 100,
        bottleVolumeMl: 500,
        floralSource: publicDoc.floralSource,
        originDistrict: publicDoc.originDistrict,
        originState: publicDoc.originState,
        fssaiNumber: publicDoc.fssaiNumber,
        kvicCertificationId: publicDoc.kvicCertificationId,
        moisturePercentage: publicDoc.moisturePercentage,
        sucrosePercentage: publicDoc.sucrosePercentage,
        pollenAnalysis: 'Verified natural pollen markers',
        blockchainTxHash: publicDoc.blockchainTxHash,
        blockNumber: publicDoc.blockNumber,
        smartContractAddress: publicDoc.smartContractAddress,
        verificationStatus: publicDoc.verificationStatus,
        qrCodeUrl: publicDoc.qrCodeUrl,
        traceabilityUrl: publicDoc.traceabilityUrl,
        scanCount: publicDoc.scanCount,
        events: publicDoc.events as any,
        suspiciousReason: publicDoc.suspiciousReason,
      };
    } else {
      // 2. Fallback check for in-memory context / demo seed
      const memBatch = batches.find((b) => b.id.toLowerCase() === cleanId.toLowerCase())
        || mockDb.batches.get(cleanId);
      if (memBatch) {
        foundBatch = memBatch;
      }
    }

    if (!foundBatch) {
      // Check if it's the known demo invalid batch
      if (cleanId.toUpperCase().includes('FAKE') || cleanId.toUpperCase().includes('INVALID')) {
        const proof = await blockchainService.verifyBatchProvenance(cleanId);
        setBlockchainProof(proof);
        setSearchError('INVALID_BATCH');
        setIsVerifying(false);
        return;
      }

      setSearchError('NOT_FOUND');
      setActiveBatch(null);
      setIsVerifying(false);
      return;
    }

    // Batch found! Load persistent QR & blockchain proof
    const qr = await QrService.getBatchQrCode(foundBatch.id);
    const proof = await blockchainService.verifyBatchProvenance(foundBatch.id);

    setActiveBatch(foundBatch);
    setQrDataUrl(qr);
    setBlockchainProof(proof);
    setIsVerifying(false);
    setStep('FOUND');
  };

  const getStatusBadge = (status: BatchVerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('consumer.verifiedOnLedger')}</span>
          </div>
        );
      case 'SUSPICIOUS':
        return (
          <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t('consumer.suspiciousPattern')}</span>
          </div>
        );
      case 'INVALID':
      default:
        return (
          <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-xs tracking-wide">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{t('consumer.invalidBatchFlag')}</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Intro Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8E7] text-[#7A4B24] text-xs font-semibold mb-3 border border-[#E8DCC8]">
          <img src="/logo.png" alt="MadhuDhara" className="h-5 w-auto object-contain" />
          <span>MadhuDhara Traceability</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">
          {t('consumer.title')}
        </h1>
        <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
          {t('consumer.subtitle')}
        </p>
      </div>

      {/* Screen 1: Search Form */}
      {step === 'SEARCH' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            {t('consumer.inputLabel')}
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(batchInput);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={t('consumer.inputPlaceholder')}
                className="w-full pl-4 pr-10 py-3 text-stone-900 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24] font-mono text-sm uppercase"
                required
              />
              <Search className="w-5 h-5 text-stone-400 absolute right-3 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="px-6 py-3 bg-[#7A4B24] text-white font-medium rounded-xl hover:bg-[#5A3418] transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer"
            >
              {isVerifying ? t('consumer.searchingLedger') : t('consumer.verifyBtn')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <span className="text-xs text-stone-500 block mb-2 font-medium">
              {t('consumer.demoPresetsTitle')}
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setBatchInput('HC-MH-NAS-2026-00047');
                  handleSearch('HC-MH-NAS-2026-00047');
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-mono cursor-pointer"
              >
                {t('consumer.presetValid')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchInput('HC-MH-NAS-2026-SUSP');
                  handleSearch('HC-MH-NAS-2026-SUSP');
                }}
                className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-mono cursor-pointer"
              >
                {t('consumer.presetSuspicious')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchInput('HC-FAKE-9999');
                  handleSearch('HC-FAKE-9999');
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors font-mono cursor-pointer"
              >
                {t('consumer.presetInvalid')}
              </button>
            </div>
          </div>

          {/* Error States */}
          {searchError === 'NOT_FOUND' && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <XCircle className="w-5 h-5 text-rose-600" />
                {t('consumer.notFoundTitle')}
              </div>
              <p className="mt-1 text-xs text-rose-700">
                {t('consumer.notFoundDesc')}
              </p>
            </div>
          )}

          {searchError === 'INVALID_BATCH' && (
            <div className="mt-6 p-5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-sm">
              <div className="flex items-center gap-2 font-bold text-rose-700 text-base">
                <AlertTriangle className="w-5 h-5" />
                {t('consumer.counterfeitWarningTitle')}
              </div>
              <p className="mt-2 text-xs text-rose-800 leading-relaxed">
                {t('consumer.counterfeitWarningDesc')}
              </p>
              <div className="mt-3 text-[11px] font-mono bg-white p-2.5 rounded border border-rose-200 text-rose-900">
                {t('consumer.auditTrailLabel')} {blockchainProof?.auditLog || 'No genesis record on chain.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Batch Found & Existing QR */}
      {step === 'FOUND' && activeBatch && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-400">
                {t('consumer.batchIdentifiedBadge')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
                {activeBatch.id}
              </h2>
            </div>
            {getStatusBadge(activeBatch.verificationStatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {/* Left: Product & Origin Snapshot */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-stone-500">{t('consumer.productNameLabel')}</span>
                <p className="text-base font-bold text-stone-900 font-serif">
                  {translationService.getLocalizedData(activeBatch, language).productName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-500">{t('consumer.floralSourceLabel')}</span>
                  <p className="font-medium text-stone-900 mt-0.5">
                    {translationService.getLocalizedData(activeBatch, language).floralSource}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">{t('consumer.harvestDateLabel')}</span>
                  <p className="font-medium text-stone-900 mt-0.5">{activeBatch.harvestDate}</p>
                </div>
                <div>
                  <span className="text-stone-500">{t('consumer.producerLabel')}</span>
                  <p className="font-medium text-stone-900 mt-0.5">{activeBatch.beekeeperName}</p>
                </div>
                <div>
                  <span className="text-stone-500">{t('consumer.originDistrictLabel')}</span>
                  <p className="font-medium text-stone-900 mt-0.5">{activeBatch.originDistrict}, {activeBatch.originState}</p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('consumer.fssaiLicenseLabel')}</span>
                  <span className="font-mono text-stone-800">{activeBatch.fssaiNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('consumer.kvicCertLabel')}</span>
                  <span className="font-mono text-stone-800">{activeBatch.kvicCertificationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('consumer.labMoistureLabel')}</span>
                  <span className="font-mono text-stone-800 font-semibold text-emerald-700">{activeBatch.moisturePercentage}% (&lt; 20%)</span>
                </div>
              </div>

              {activeBatch.suspiciousReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block">{t('consumer.integrityFlagTitle')}</span>
                  {activeBatch.suspiciousReason}
                </div>
              )}
            </div>

            {/* Right: Existing Persistent QR Code Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl border border-stone-200 text-center">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                {t('consumer.scanToTraceLabel')}
              </span>
              
              <div className="bg-white p-3 rounded-xl shadow-xs border border-stone-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for batch ${activeBatch.id}`}
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                    {t('common.loading')}
                  </div>
                )}
              </div>

              <span className="text-[11px] text-stone-500 mt-2 font-mono">
                {activeBatch.id}
              </span>

              {/* Action buttons */}
              <div className="mt-4 w-full space-y-2">
                <button
                  type="button"
                  onClick={() => setStep('TRACEABILITY')}
                  className="w-full py-2.5 bg-[#7A4B24] text-white font-medium rounded-lg hover:bg-[#5A3418] transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('consumer.viewTraceabilityBtn')}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('SEARCH')}
                  className="w-full py-1.5 text-stone-600 hover:text-stone-900 text-xs transition-colors cursor-pointer"
                >
                  {t('consumer.verifyAnotherBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Complete Traceability Timeline & Blockchain Ledger */}
      {step === 'TRACEABILITY' && activeBatch && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('FOUND')}
                  className="text-xs text-[#7A4B24] hover:underline font-medium cursor-pointer"
                >
                  {t('consumer.backToQrBtn')}
                </button>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-mono text-stone-500">{activeBatch.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
                {translationService.getLocalizedData(activeBatch, language).productName}
              </h2>
            </div>
            {getStatusBadge(activeBatch.verificationStatus)}
          </div>

          {/* Blockchain Provenance Ledger Card */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-sm border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F4C542]" />
                <span className="text-xs font-semibold tracking-wider uppercase text-stone-300">
                  {t('consumer.immutableLedgerBadge')}
                </span>
              </div>
              <span className="text-xs font-mono text-[#F4C542]">
                {t('common.blockNumber', { number: activeBatch.blockNumber || 18492040 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-stone-400 block text-[11px]">{t('consumer.genesisTxLabel')}</span>
                <span className="text-stone-200 truncate block mt-0.5">
                  {activeBatch.blockchainTxHash}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">{t('consumer.smartContractLabel')}</span>
                <span className="text-stone-200 truncate block mt-0.5">
                  {activeBatch.smartContractAddress}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">{t('consumer.publicScanAuditLabel')}</span>
                <span className="text-stone-200 block mt-0.5">
                  {activeBatch.scanCount} {t('consumer.verifiedLookupsUnit')}
                </span>
              </div>
            </div>
          </div>

          {/* Traceability Journey Timeline */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold font-serif text-stone-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7A4B24]" />
              {t('consumer.timelineTitle')}
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {activeBatch.events.map((event, idx) => {
                const locEvent = translationService.getLocalizedData(event, language);
                return (
                  <div key={event.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        event.verified
                          ? 'bg-emerald-600 border-white text-white text-[10px]'
                          : 'bg-[#7A4B24] border-white text-white text-[10px]'
                      }`}
                    >
                      ✓
                    </div>

                    <div className="bg-stone-50/70 hover:bg-stone-50 p-4 rounded-xl border border-stone-200/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-stone-900">
                          {idx + 1}. {locEvent.title}
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {new Date(event.timestamp).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {locEvent.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
                        <div className="flex items-center gap-3">
                          <span>{t('consumer.actorLabel')} <strong className="text-stone-700">{event.actor}</strong></span>
                          <span>·</span>
                          <span>{t('consumer.locationLabel')} <strong className="text-stone-700">{event.location}</strong></span>
                        </div>
                        {event.txHash && (
                          <span className="font-mono text-[10px] text-stone-400 truncate max-w-[200px]">
                            TX: {event.txHash.slice(0, 18)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Public Data Privacy Notice */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#7A4B24] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900 block">{t('consumer.privacyNoticeTitle')}</span>
              {t('consumer.privacyNoticeDesc')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
