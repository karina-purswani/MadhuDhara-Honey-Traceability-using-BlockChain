import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { LearningContent, LanguageCode } from '../../shared/types';
import { translationService } from '../services/translation.service';
import { 
  BookOpen, 
  Play, 
  Plus, 
  ExternalLink, 
  Clock, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Video 
} from 'lucide-react';

export const LearningHubView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, language: currentLang } = useLanguage();
  const { learningItems, publishLearningContent } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);

  // New content form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LearningContent['category']>('hive_management');
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [authorName, setAuthorName] = useState('KVIC Directorate of Honey Mission');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  const categories = [
    { id: 'all', label: t('learning.allTutorials') },
    { id: 'hive_management', label: t('learning.hiveManagement') },
    { id: 'disease_control', label: t('learning.diseaseControl') },
    { id: 'extraction', label: t('learning.extraction') },
    { id: 'kvic_schemes', label: t('learning.kvicSchemes') },
  ];

  const filteredItems = activeCategory === 'all'
    ? learningItems
    : learningItems.filter((item) => item.category === activeCategory);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    publishLearningContent({
      title,
      description,
      category,
      youtubeUrl,
      durationMinutes,
      language,
      authorName,
    });

    setShowPublishSuccess(true);
    setTimeout(() => {
      setShowPublishSuccess(false);
      setPublishModalOpen(false);
      setTitle('');
      setDescription('');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('learning.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('learning.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t('learning.subtitle')}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setPublishModalOpen(true)}
            className="px-4 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('learning.publishGuideBtn')}</span>
          </button>
        )}
      </div>

      {/* Category Tabs (Segmented control) */}
      <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-xl max-w-fit">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Learning Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 border border-stone-200 rounded-2xl p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            {t('learning.noContentAvailable') || 'No learning guides available'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {isAdmin
              ? 'No guides currently published in this category. Click "Publish Guide" above to publish official training resources.'
              : 'There are no published guides in this category right now. Please check back later.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const locItem = translationService.getLocalizedData(item, currentLang);
            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                {/* Visual Header / Thumbnail Placeholder */}
                <div className="h-44 bg-gradient-to-tr from-amber-800 via-stone-800 to-amber-950 p-4 relative flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                      {item.durationMinutes} {t('learning.minsUnit')}
                    </span>
                    <span className="font-semibold text-[11px] bg-amber-500/80 px-2 py-0.5 rounded uppercase">
                      {item.language.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                    <span className="text-xs text-amber-200 font-medium truncate">
                      {item.authorName}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900 leading-snug">
                      {locItem.title}
                    </h3>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                      {locItem.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {t('learning.publishedOn')} {item.publishedDate}
                    </span>
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{t('learning.watchVideoBtn')}</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Modal for KVIC Officers */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {t('learning.publishModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!showPublishSuccess ? (
              <form onSubmit={handlePublish} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('learning.tutorialTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder={t('learning.tutorialTitlePlaceholder')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('learning.descLabel')}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder={t('learning.descPlaceholder')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      {t('learning.categoryLabel')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                    >
                      <option value="hive_management">{t('learning.hiveManagement')}</option>
                      <option value="disease_control">{t('learning.diseaseControl')}</option>
                      <option value="extraction">{t('learning.extraction')}</option>
                      <option value="kvic_schemes">{t('learning.kvicSchemes')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      {t('learning.primaryLanguageLabel')}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('learning.youtubeUrlLabel')}
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-700">
                  <span className="font-semibold text-stone-900 block mb-0.5">{t('learning.notificationPushTitle')}</span>
                  {t('learning.notificationPushDesc')}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    {t('learning.publishSendAlertBtn')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900 font-serif">
                  {t('learning.broadcastSuccessTitle')}
                </h4>
                <p className="text-xs text-stone-500">
                  {t('learning.broadcastSuccessDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
