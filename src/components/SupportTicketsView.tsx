import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { SupportTicket, TicketMessage } from '../../shared/types';
import { 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  MessageSquare, 
  Thermometer, 
  Scale 
} from 'lucide-react';

interface SupportTicketsViewProps {
  onNavigateTab?: (tab: string, extraId?: string) => void;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({ onNavigateTab }) => {
  const { isAdmin, isBeekeeper, currentUser } = useAuth();
  const { t } = useLanguage();
  const { tickets, respondToTicket, setSelectedHiveId } = useApp();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replyStatus, setReplyStatus] = useState<SupportTicket['status']>('RESPONDED');

  useEffect(() => {
    if (tickets.length > 0 && (!selectedTicketId || !tickets.some((t) => t.id === selectedTicketId))) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    respondToTicket(
      selectedTicket.id,
      replyMessage,
      isAdmin ? replyStatus : selectedTicket.status
    );
    setReplyMessage('');
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">{t('tickets.statuses.open')}</span>;
      case 'IN REVIEW':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800">{t('tickets.statuses.inReview')}</span>;
      case 'RESPONDED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">{t('tickets.statuses.responded')}</span>;
      case 'RESOLVED':
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">{t('tickets.statuses.resolved')}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
          <LifeBuoy className="w-4 h-4 text-[#7A4B24]" />
          <span>{t('tickets.badge')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
          {t('tickets.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          {isAdmin 
            ? t('tickets.subtitleAdmin')
            : t('tickets.subtitleBeekeeper')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tickets List */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              {isAdmin ? t('tickets.allInquiriesTitle') : t('tickets.myTicketsTitle')} ({tickets.length})
            </span>
          </div>

          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                {t('tickets.noTicketsFound')}
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-[#FFF8E7] border-l-4 border-[#7A4B24]'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {ticket.id}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <h4 className="text-xs font-bold text-stone-900 mt-1 font-serif line-clamp-1">
                    {ticket.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                    <span>{ticket.beekeeperName}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Attached Sensor Telemetry */}
        {selectedTicket ? (
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-xs p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Ticket Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#7A4B24] bg-[#FFF8E7] border border-[#E8DCC8] px-2 py-0.5 rounded">
                      {selectedTicket.id}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-stone-500 font-mono">
                      {t('common.box')} {selectedTicket.hiveId || 'H023'}
                    </span>
                    {selectedTicket.hiveId && onNavigateTab && (
                      <button
                        onClick={() => {
                          setSelectedHiveId(selectedTicket.hiveId!);
                          onNavigateTab('hives');
                        }}
                        className="text-[10px] font-semibold text-[#7A4B24] hover:text-[#5A3418] bg-[#FFF8E7] hover:bg-[#faeed1] px-2 py-0.5 rounded transition-colors cursor-pointer border border-[#E8DCC8]"
                        title="Drill down to inspect this specific hive passport"
                      >
                        {t('admin.inspectPassportBtn')}
                      </button>
                    )}
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-600 font-medium">
                      {t('consumer.producerLabel')}: {selectedTicket.beekeeperName}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {selectedTicket.title}
                  </h2>
                </div>

                {getStatusBadge(selectedTicket.status)}
              </div>

              {/* Prefilled IoT Telemetry Snapshot (USP) */}
              {selectedTicket.prefilledTelemetry && (
                <div className="my-4 p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>{t('tickets.attachedSnapshotTitle')}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="text-[10px] text-stone-400 block font-sans">{t('dashboard.broodTemp')}</span>
                      <span className="font-bold text-amber-900">
                        {selectedTicket.prefilledTelemetry.temperature}°C
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="text-[10px] text-stone-400 block font-sans">{t('dashboard.humidity')}</span>
                      <span className="font-bold text-stone-800">
                        {selectedTicket.prefilledTelemetry.humidity}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="text-[10px] text-stone-400 block font-sans">{t('dashboard.hiveWeight')}</span>
                      <span className="font-bold text-stone-800">
                        {selectedTicket.prefilledTelemetry.weight} {t('common.kg')}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="text-[10px] text-stone-400 block font-sans">{t('hives.healthIndex')}</span>
                      <span className="font-bold text-amber-700">
                        {selectedTicket.prefilledTelemetry.healthScore}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              <div className="space-y-4 my-6 max-h-[340px] overflow-y-auto pr-1">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border text-xs leading-relaxed ${
                      msg.senderRole === 'admin'
                        ? 'bg-amber-50/40 border-amber-200/80 ml-6 sm:ml-12'
                        : 'bg-stone-50 border-stone-200 mr-6 sm:mr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-stone-200/40 text-[11px]">
                      <span className="font-bold text-stone-900">
                        {msg.senderName} ({msg.senderRole === 'admin' ? t('navigation.adminRole') : t('navigation.beekeeperRole')})
                      </span>
                      <span className="text-stone-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-stone-700">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tickets.postResponseTitle')}
                </label>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium">{t('tickets.updateStatusLabel')}</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value as any)}
                      className="text-xs border border-stone-300 rounded-lg px-2 py-1 bg-white font-medium"
                    >
                      <option value="IN REVIEW">{t('tickets.statuses.inReview')}</option>
                      <option value="RESPONDED">{t('tickets.statuses.responded')}</option>
                      <option value="RESOLVED">{t('tickets.statuses.resolved')}</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    isAdmin
                      ? t('tickets.placeholderAdmin')
                      : t('tickets.placeholderBeekeeper')
                  }
                  required
                  className="flex-1 px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('tickets.sendBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-xs p-12 text-center text-xs text-stone-400">
            {t('tickets.selectTicketPrompt')}
          </div>
        )}
      </div>
    </div>
  );
};
