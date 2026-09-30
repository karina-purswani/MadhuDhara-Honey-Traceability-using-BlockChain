import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { HiveAlert, AlertSeverity } from '../../shared/types';
import { translationService } from '../services/translation.service';
import { 
  AlertTriangle, 
  Thermometer, 
  Scale, 
  Droplets, 
  Activity, 
  LifeBuoy, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  Send,
  MessageSquare
} from 'lucide-react';

interface IoTSmartAlertsViewProps {
  onNavigateTab: (tab: string) => void;
  preselectedAlertId?: string;
}

export const IoTSmartAlertsView: React.FC<IoTSmartAlertsViewProps> = ({ onNavigateTab, preselectedAlertId }) => {
  const { t, language } = useLanguage();
  const { alerts, acknowledgeAlert, createSupportTicket, selectedHive, liveReading } = useApp();

  // Modal / Drawer state for 1-click ticket creation
  const [activeAlertForTicket, setActiveAlertForTicket] = useState<HiveAlert | null>(
    preselectedAlertId ? alerts.find((a) => a.id === preselectedAlertId) || null : null
  );
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleOpenTicketModal = (alert: HiveAlert) => {
    const locAlert = translationService.getLocalizedData(alert, language);
    setActiveAlertForTicket(alert);
    setTicketMessage(
      `${t('iot.autoAttachmentDesc')} - ${locAlert.title} (${alert.observedValue}).`
    );
    setSubmittedTicketId(null);
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlertForTicket) return;

    setIsSubmitting(true);
    const newTicket = await createSupportTicket({
      hiveId: activeAlertForTicket.hiveId,
      alertId: activeAlertForTicket.id,
      title: activeAlertForTicket.title,
      message: ticketMessage,
    });

    setIsSubmitting(false);
    setSubmittedTicketId(newTicket.id);
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 uppercase">
            {t('iot.criticalSeverity')}
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 uppercase">
            {t('iot.warningSeverity')}
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 uppercase">
            {t('iot.advisorySeverity')}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('iot.anomalyBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('iot.title')}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('iot.subtitle')}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('tickets')}
          className="px-4 py-2 border border-stone-300 hover:border-[#7A4B24]/40 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#7A4B24]" />
          <span>{t('iot.viewTicketsBtn')}</span>
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const locAlert = translationService.getLocalizedData(alert, language);
          return (
            <div
              key={alert.id}
              className={`border rounded-2xl p-6 transition-all ${
                alert.severity === 'critical'
                  ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-mono text-stone-500">
                    {alert.hiveId}
                  </span>
                  <span className="text-xs text-stone-400">·</span>
                  <span className="text-xs text-stone-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {alert.linkedTicketId ? (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('iot.ticketRaisedLabel')} {alert.linkedTicketId}
                  </span>
                ) : alert.isAcknowledged ? (
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t('iot.acknowledgedBadge')}
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">{t('iot.awaitingAction')}</span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {locAlert.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                  {locAlert.message}
                </p>
              </div>

              {/* Metrics Context Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-3 bg-white/80 rounded-xl border border-stone-200/70 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">{t('iot.observedSensorValue')}</span>
                  <span className="font-mono font-bold text-stone-900 mt-0.5 block">
                    {alert.observedValue}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">{t('iot.biologicalIdealRange')}</span>
                  <span className="font-mono text-emerald-800 mt-0.5 block">
                    {alert.idealRange}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-stone-400 block text-[11px]">{t('iot.triggerParameter')}</span>
                  <span className="capitalize font-semibold text-stone-800 mt-0.5 block">
                    {alert.parameter}
                  </span>
                </div>
              </div>

              {/* Recommended Action & 1-Click Ticket Trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="text-xs text-stone-600">
                  <strong className="text-stone-800">{t('iot.actionPlanLabel')} </strong>
                  {locAlert.recommendedAction}
                </div>

                <div className="flex items-center gap-2">
                  {!alert.isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3.5 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>{t('iot.acknowledgeBtn')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenTicketModal(alert)}
                    className="px-4 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>{t('iot.raiseSupportTicketBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Click Prefilled Support Ticket Modal (USP) */}
      {activeAlertForTicket && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {t('iot.modalPrefillTitle')}
                </h3>
              </div>
              <button
                onClick={() => setActiveAlertForTicket(null)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {!submittedTicketId ? (
              <form onSubmit={handleSendTicket} className="mt-4 space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 block">{t('iot.autoAttachmentNote')}</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {t('iot.autoAttachmentDesc')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>{t('hives.hiveId')}: <strong>{activeAlertForTicket.hiveId}</strong></div>
                    <div>Alert ID: <strong>{activeAlertForTicket.id}</strong></div>
                    <div>{t('iot.readingLabel')} <strong>{activeAlertForTicket.observedValue}</strong></div>
                    <div>{t('iot.healthScoreLabel')} <strong>64%</strong></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('iot.ticketTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={translationService.getLocalizedData(activeAlertForTicket, language).title}
                    readOnly
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('iot.ticketDescriptionLabel')}
                  </label>
                  <textarea
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                    placeholder={t('iot.ticketDescPlaceholder')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveAlertForTicket(null)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? t('iot.submittingTicket') : t('iot.submitTicketToKvic')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900 font-serif">
                  {t('iot.ticketDispatchedTitle')}
                </h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  {t('iot.ticketDispatchedDesc')}
                </p>
                <div className="font-mono text-xs bg-stone-50 p-2 rounded border border-stone-200 max-w-xs mx-auto">
                  Ticket #{submittedTicketId}
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setActiveAlertForTicket(null);
                      onNavigateTab('tickets');
                    }}
                    className="px-4 py-2 bg-[#7A4B24] text-white text-xs font-medium rounded-lg hover:bg-[#5A3418] shadow-xs cursor-pointer"
                  >
                    {t('iot.openTicketConversationBtn')}
                  </button>
                  <button
                    onClick={() => setActiveAlertForTicket(null)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
