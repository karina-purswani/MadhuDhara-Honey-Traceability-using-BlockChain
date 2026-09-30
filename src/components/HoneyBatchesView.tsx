import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { HoneyBatch } from '../../shared/types';
import { QrService } from '../services/qr.service';
import { translationService } from '../services/translation.service';
import { 
  Layers, 
  Plus, 
  ShieldCheck, 
  QrCode, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  Sparkles 
} from 'lucide-react';

interface HoneyBatchesViewProps {
  onNavigateTab: (tab: string, batchId?: string) => void;
}

export const HoneyBatchesView: React.FC<HoneyBatchesViewProps> = ({ onNavigateTab }) => {
  const { t, language } = useLanguage();
  const { batches, hives, createHoneyBatch } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productName, setProductName] = useState('Pure Raw Sahyadri Multi-Floral Honey');
  const [floralSource, setFloralSource] = useState('Wild Forest Flora, Mustard & Jamun');
  const [quantityKg, setQuantityKg] = useState(12.5);
  const [selectedHiveId, setSelectedHiveId] = useState(hives[0]?.id || '');
  const [isMinting, setIsMinting] = useState(false);
  const [newlyCreatedBatch, setNewlyCreatedBatch] = useState<HoneyBatch | null>(null);

  // QR Modal viewer
  const [qrModalBatch, setQrModalBatch] = useState<HoneyBatch | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');

  const handleOpenQrModal = async (batch: HoneyBatch) => {
    const qr = await QrService.getBatchQrCode(batch.id);
    setQrModalBatch(batch);
    setQrModalDataUrl(qr);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMinting(true);

    const batch = await createHoneyBatch({
      productName,
      floralSource,
      quantityKg,
      hiveId: selectedHiveId,
    });

    setIsMinting(false);
    setNewlyCreatedBatch(batch);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('batches.provenanceBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('batches.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t('batches.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedBatch(null);
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('batches.mintNewBatchBtn')}</span>
        </button>
      </div>

      {/* Batches Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => {
          const locBatch = translationService.getLocalizedData(batch, language);
          return (
            <div
              key={batch.id}
              className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 hover:shadow-sm transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                    {batch.id}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {batch.verificationStatus}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-1">
                    {locBatch.productName}
                  </h3>
                  <span className="text-xs text-stone-500 block mt-0.5">
                    {locBatch.floralSource}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-stone-400 block">{t('batches.harvestDateLabel')}</span>
                    <span className="font-medium text-stone-800">{batch.harvestDate}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">{t('batches.quantityLabel')}</span>
                    <span className="font-medium text-stone-800">{batch.quantityBottles} {t('common.bottles')}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">{t('batches.moistureLabel')}</span>
                    <span className="font-mono font-medium text-emerald-700">{batch.moisturePercentage}%</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">{t('batches.originLabel')}</span>
                    <span className="font-medium text-stone-800">{batch.originDistrict}</span>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-stone-400 font-mono truncate">
                  Tx: {batch.blockchainTxHash}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQrModal(batch)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{t('batches.showQrBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('verify', batch.id)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('batches.verifyTraceBtn')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mint New Batch Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {t('batches.modalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {!newlyCreatedBatch ? (
              <form onSubmit={handleCreateBatch} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('batches.originHiveLabel')}
                  </label>
                  <select
                    value={selectedHiveId}
                    onChange={(e) => setSelectedHiveId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {hives.map((h) => (
                      <option key={h.id} value={h.id}>
                        Box {h.boxNumber} · {h.id} ({h.currentHealthScore}% health)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('batches.productTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('batches.floralSourceLabel')}
                  </label>
                  <input
                    type="text"
                    value={floralSource}
                    onChange={(e) => setFloralSource(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('batches.harvestQtyLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    {t('batches.jarYieldEstimate')}
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                  <span className="font-semibold text-stone-800 block mb-0.5">{t('batches.workflowNoteTitle')}</span>
                  {t('batches.workflowNoteDesc')}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isMinting}
                    className="px-5 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isMinting ? t('batches.mintingInProgress') : t('batches.confirmMintBtn')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 font-serif">
                    {t('batches.mintSuccessTitle')}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 font-mono">
                    {t('batches.batchIdLabel')} {newlyCreatedBatch.id}
                  </p>
                  <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto">
                    {t('batches.txHashLabel')} <span className="font-mono text-[10px] text-amber-900">{newlyCreatedBatch.blockchainTxHash}</span>
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setCreateModalOpen(false);
                      handleOpenQrModal(newlyCreatedBatch);
                    }}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
                  >
                    {t('batches.viewPersistentQrBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent QR Code Preview Modal */}
      {qrModalBatch && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {t('batches.qrModalTitle')}
              </span>
              <button
                onClick={() => setQrModalBatch(null)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-4 bg-stone-50 rounded-xl border border-stone-200 inline-block">
              <img
                src={qrModalDataUrl}
                alt={`QR code for ${qrModalBatch.id}`}
                className="w-52 h-52 mx-auto"
              />
            </div>

            <span className="font-mono text-xs font-bold text-stone-900 block">
              {qrModalBatch.id}
            </span>
            <p className="text-xs text-stone-500 mt-1">
              {translationService.getLocalizedData(qrModalBatch, language).productName}
            </p>

            <div className="mt-4 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setQrModalBatch(null);
                  onNavigateTab('verify', qrModalBatch.id);
                }}
                className="w-full py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {t('batches.openPublicTraceBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
