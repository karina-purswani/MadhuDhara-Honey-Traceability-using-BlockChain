/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { HivePassportView } from './components/HivePassportView';
import { IoTSmartAlertsView } from './components/IoTSmartAlertsView';
import { HoneyBatchesView } from './components/HoneyBatchesView';
import { PublicVerifyView } from './components/PublicVerifyView';
import { MarketplaceView } from './components/MarketplaceView';
import { LearningHubView } from './components/LearningHubView';
import { SupportTicketsView } from './components/SupportTicketsView';
import { ProfitCalculatorView } from './components/ProfitCalculatorView';
import { AIDiseaseRiskView } from './components/AIDiseaseRiskView';
import { AIYieldPredictionView } from './components/AIYieldPredictionView';
import { AdminClusterView } from './components/AdminClusterView';

const MainContent: React.FC = () => {
  const { isAuthenticated, isBeekeeper, isAdmin, isConsumer } = useAuth();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<string>('verify');
  const [targetBatchId, setTargetBatchId] = useState<string | undefined>(undefined);
  const [preselectedAlertId, setPreselectedAlertId] = useState<string | undefined>(undefined);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Handle URL deep-linking: e.g. /trace/HC-MH-NAS-2026-00047 or hash routing
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/trace/')) {
      const batchFromUrl = decodeURIComponent(path.replace('/trace/', ''));
      if (batchFromUrl) {
        setTargetBatchId(batchFromUrl);
        setCurrentTab('verify');
      }
    }
  }, []);

  // Update default tab upon login/logout
  useEffect(() => {
    if (isBeekeeper) {
      setCurrentTab('dashboard');
    } else if (isAdmin) {
      setCurrentTab('admin');
    } else {
      setCurrentTab('verify');
    }
  }, [isAuthenticated, isBeekeeper, isAdmin]);

  const handleNavigateTab = (tab: string, batchId?: string) => {
    if (batchId) {
      setTargetBatchId(batchId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTicketWithAlert = (alertId: string) => {
    setPreselectedAlertId(alertId);
    setCurrentTab('alerts');
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/50 text-stone-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => handleNavigateTab(tab)}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Main Body View Routing */}
      <main className="flex-1">
        {currentTab === 'dashboard' && isBeekeeper && (
          <DashboardView
            onNavigateTab={handleNavigateTab}
            onOpenTicketWithAlert={handleOpenTicketWithAlert}
          />
        )}

        {currentTab === 'hives' && isAuthenticated && (
          <HivePassportView onNavigateTab={handleNavigateTab} />
        )}

        {currentTab === 'alerts' && isBeekeeper && (
          <IoTSmartAlertsView
            onNavigateTab={handleNavigateTab}
            preselectedAlertId={preselectedAlertId}
          />
        )}

        {currentTab === 'batches' && isAuthenticated && (
          <HoneyBatchesView onNavigateTab={handleNavigateTab} />
        )}

        {currentTab === 'verify' && (
          <PublicVerifyView initialBatchId={targetBatchId} />
        )}

        {currentTab === 'marketplace' && (
          <MarketplaceView onNavigateTab={handleNavigateTab} />
        )}

        {currentTab === 'learning' && isAuthenticated && (
          <LearningHubView />
        )}

        {currentTab === 'tickets' && isAuthenticated && (
          <SupportTicketsView onNavigateTab={handleNavigateTab} />
        )}

        {currentTab === 'profit' && isBeekeeper && (
          <ProfitCalculatorView />
        )}

        {currentTab === 'ai-disease' && isBeekeeper && (
          <AIDiseaseRiskView onNavigateTab={handleNavigateTab} />
        )}

        {currentTab === 'ai-yield' && isBeekeeper && (
          <AIYieldPredictionView onNavigateTab={handleNavigateTab} />
        )}

        {(currentTab === 'admin' || currentTab === 'beekeepers') && isAdmin && (
          <AdminClusterView
            initialSection={currentTab === 'beekeepers' ? 'beekeepers' : 'overview'}
            onNavigateTab={handleNavigateTab}
          />
        )}
      </main>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccessRedirect={(tab) => handleNavigateTab(tab)}
      />

      {/* Quiet, Accessible Editorial Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MadhuDhara" className="h-5 w-auto object-contain" />
            <span className="font-serif font-bold text-stone-900 text-sm">{t('common.brandName')}</span>
            <span>·</span>
            <span>{t('common.tagline')}</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>{t('common.cbriStandards')}</span>
            <span>·</span>
            <span>{t('common.isoCertified')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppProvider>
          <MainContent />
        </AppProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
