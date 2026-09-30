import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../../shared/types';
import { 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  X, 
  AlertCircle, 
  KeyRound, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccessRedirect?: (tab: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  onSuccessRedirect 
}) => {
  const { login, registerBeekeeper } = useAuth();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVillage, setRegVillage] = useState('Dindori');
  const [regDistrict, setRegDistrict] = useState('Nashik');
  const [regState, setRegState] = useState('Maharashtra');
  const [regExperience, setRegExperience] = useState(4);
  const [regLang, setRegLang] = useState<LanguageCode>(language);
  const [regKvicNo, setRegKvicNo] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      onClose();
      if (onSuccessRedirect) {
        onSuccessRedirect('dashboard');
      }
    } else {
      const errKey = result.error || 'auth.errGeneral';
      setError(errKey.startsWith('auth.') ? t(errKey) : errKey);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await registerBeekeeper({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      village: regVillage,
      district: regDistrict,
      state: regState,
      experienceYears: Number(regExperience),
      preferredLanguage: regLang,
      kvicRegistrationNumber: regKvicNo || undefined,
    });
    setLoading(false);

    if (result.success) {
      onClose();
      if (onSuccessRedirect) {
        onSuccessRedirect('dashboard');
      }
    } else {
      const errKey = result.error || 'auth.errAccountExists';
      setError(errKey.startsWith('auth.') ? t(errKey) : errKey);
    }
  };

  const fillQuickCredentials = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pb-4 border-b border-stone-100 pr-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="MadhuDhara" className="h-8 w-auto object-contain" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[11px] font-semibold text-[#7A4B24] uppercase tracking-wider border border-[#E8DCC8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7A4B24]" />
              <span>{t('auth.portalBadge')}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {mode === 'login' ? t('auth.signInTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'login' 
              ? t('auth.signInDesc')
              : t('auth.registerDesc')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#7A4B24] hover:bg-[#5A3418] text-white font-medium rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? t('auth.authenticatingBtn') : t('auth.signInBtn')}</span>
            </button>

            {/* Quick Fill Credentials Helper for Testing */}
            <div className="pt-4 border-t border-stone-100">
              <span className="text-[11px] font-medium text-stone-400 block mb-2">
                {t('auth.quickFillTitle')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('beekeeper@example.com', 'password123')}
                  className="p-2.5 bg-stone-50 hover:bg-[#FFF8E7] hover:border-[#D99A24] border border-stone-200 rounded-lg text-left text-[11px] transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-stone-800 block">Ramesh Patil</span>
                  <span className="text-stone-500">{t('auth.beekeeperPreset')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('admin@example.com', 'admin123')}
                  className="p-2.5 bg-stone-50 hover:bg-[#FFF8E7] hover:border-[#D99A24] border border-stone-200 rounded-lg text-left text-[11px] transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-stone-800 block">Dr. Anil Joshi</span>
                  <span className="text-stone-500">{t('auth.adminPreset')}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="text-xs text-[#7A4B24] hover:underline font-medium cursor-pointer"
              >
                {t('auth.newBeekeeperPrompt')}
              </button>
            </div>
          </form>
        ) : (
          /* Mode: Register */
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.fullNameLabel')}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.phoneLabel')}
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.emailLabel')}
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="beekeeper@farm.in"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder={t('auth.passwordMinLength')}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.villageLabel')}
                </label>
                <input
                  type="text"
                  value={regVillage}
                  onChange={(e) => setRegVillage(e.target.value)}
                  required
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.districtLabel')}
                </label>
                <input
                  type="text"
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  required
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.stateLabel')}
                </label>
                <input
                  type="text"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  required
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.experienceLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={regExperience}
                  onChange={(e) => setRegExperience(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.preferredLanguageLabel')}
                </label>
                <select
                  value={regLang}
                  onChange={(e) => setRegLang(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {t('auth.kvicRegLabel')}
              </label>
              <input
                type="text"
                value={regKvicNo}
                onChange={(e) => setRegKvicNo(e.target.value)}
                placeholder={t('auth.kvicRegPlaceholder')}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#7A4B24]/30 focus:border-[#7A4B24]"
              />
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900 block mb-0.5">{t('auth.autoSetupNoteTitle')}</span>
              {t('auth.autoSetupNoteDesc')}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#7A4B24] hover:bg-[#5A3418] text-white font-medium rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? t('auth.creatingAccountBtn') : t('auth.registerBtn')}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs text-[#7A4B24] hover:underline font-medium cursor-pointer"
              >
                {t('auth.alreadyRegisteredPrompt')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
