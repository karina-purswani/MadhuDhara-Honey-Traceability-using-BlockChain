import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { MarketplaceProduct } from '../../shared/types';
import { translationService } from '../services/translation.service';
import { 
  ShoppingBag, 
  ShieldCheck, 
  ExternalLink, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  Clock,
  Send,
  Inbox,
  Check,
  X,
  Package,
  AlertCircle
} from 'lucide-react';

interface MarketplaceViewProps {
  onNavigateTab: (tab: string, batchId?: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onNavigateTab }) => {
  const { isBeekeeper, isAdmin, currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { 
    marketplaceProducts, 
    batches, 
    addMarketplaceProduct, 
    deleteMarketplaceProduct,
    orderRequests,
    submitOrderRequest,
    updateOrderRequestStatus
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [inquiryProduct, setInquiryProduct] = useState<MarketplaceProduct | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Form states for beekeeper listing a batch
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [title, setTitle] = useState('Raw Multi-Floral Forest Honey (500g)');
  const [priceInr, setPriceInr] = useState(380);
  const [stock, setStock] = useState(50);
  const [description, setDescription] = useState('Pure unpasteurized honey harvested from high-elevation Sahyadri forest flora.');

  // Form states for consumer order request
  const [consumerQty, setConsumerQty] = useState<number>(1);
  const [consumerName, setConsumerName] = useState('');
  const [consumerContact, setConsumerContact] = useState('');
  const [consumerMessage, setConsumerMessage] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleListProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setListError(null);

    const batch = batches.find((b) => b.id === selectedBatchId) || batches[0];
    if (!batch) {
      setListError('Please select a valid honey batch to list.');
      return;
    }

    try {
      await addMarketplaceProduct({
        batchId: batch.id,
        title,
        beekeeperId: batch.beekeeperId,
        beekeeperName: batch.beekeeperName,
        producerLocation: `${batch.originDistrict}, ${batch.originState}`,
        floralType: batch.floralSource,
        priceInr,
        weightGrams: 500,
        availableStockBottles: stock,
        harvestDate: batch.harvestDate,
        description,
        contactNumber: '+91 98234 56781',
      });

      setListModalOpen(false);
    } catch (err: any) {
      setListError(err?.message || 'Could not list product. Please verify batch ownership.');
    }
  };

  const handleSendOrderRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProduct) return;

    setOrderSubmitting(true);
    try {
      await submitOrderRequest({
        productId: inquiryProduct.id,
        productName: inquiryProduct.title,
        batchNumber: inquiryProduct.batchId,
        beekeeperUid: inquiryProduct.beekeeperUid || 'usr-beekeeper-01',
        beekeeperId: inquiryProduct.beekeeperId,
        consumerName: consumerName.trim() || 'Interested Consumer',
        consumerContact: consumerContact.trim() || 'Direct Inquiry',
        consumerMessage: consumerMessage.trim() || 'Interested in purchasing sealed jars directly from apiary.',
        requestedQuantity: consumerQty,
      });

      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setInquiryProduct(null);
        setConsumerName('');
        setConsumerContact('');
        setConsumerMessage('');
        setConsumerQty(1);
      }, 2000);
    } catch (err) {
      console.warn('Error submitting order request:', err);
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4 text-[#7A4B24]" />
            <span>{t('marketplace.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
            {t('marketplace.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {isBeekeeper && (
          <button
            onClick={() => setListModalOpen(true)}
            className="px-4 py-2.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('marketplace.listProductBtn')}</span>
          </button>
        )}
      </div>

      {/* Role Navigation Toggle for Beekeepers & Admins */}
      {(isBeekeeper || isAdmin) && (
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#7A4B24] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('marketplace.allProductsTab') || 'Marketplace Catalog'} ({marketplaceProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#7A4B24] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>{t('marketplace.ordersTab') || 'Customer Inquiries & Orders'} ({orderRequests.length})</span>
            {orderRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="bg-[#F4C542] text-[#25211D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {orderRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* TAB 1: Products Grid */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceProducts.map((prod) => {
            const locProd = translationService.getLocalizedData(prod, language);
            const isOwner = isBeekeeper && currentUser?.firebaseUid && prod.beekeeperUid === currentUser.firebaseUid;

            return (
              <div
                key={prod.id}
                className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                {/* Product Card Header */}
                <div className="h-36 bg-stone-100/80 p-5 flex flex-col justify-between border-b border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                      {prod.batchId}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {t('common.verifiedBadge')}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-stone-500 font-medium block">{t('consumer.floralSourceLabel')}</span>
                    <span className="text-xs font-serif font-bold text-stone-800">
                      {locProd.floralType}
                    </span>
                  </div>
                </div>

                {/* Product Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-serif font-bold text-base text-stone-900 leading-snug">
                        {locProd.title}
                      </h3>
                      <span className="font-mono text-lg font-bold text-amber-900 shrink-0 ml-2">
                        ₹{prod.priceInr}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {locProd.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-500">
                      <div className="flex items-center justify-between">
                        <span>{t('consumer.producerLabel')}:</span>
                        <strong className="text-stone-800">{prod.beekeeperName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('consumer.originDistrictLabel')}:</span>
                        <span className="text-stone-700">{prod.producerLocation}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('marketplace.availableStockLabel')}</span>
                        <span className="font-mono text-stone-700">{prod.availableStockBottles} {t('common.jars')} (500g)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('verify', prod.batchId)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t('marketplace.traceBatchBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInquiryProduct(prod);
                        setOrderSuccess(false);
                      }}
                      className="px-4 py-1.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      {t('marketplace.inquiryOrderBtn')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Beekeeper & Admin Order Inquiries */}
      {(isBeekeeper || isAdmin) && activeTab === 'orders' && (
        <div className="space-y-4">
          {orderRequests.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500 space-y-2">
              <Inbox className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-medium text-stone-700">
                {t('marketplace.noOrdersYet') || 'No customer order requests recorded yet.'}
              </p>
              <p className="text-[11px] text-stone-400">
                Incoming purchase requests and direct inquiries from consumers will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderRequests.map((req) => {
                const statusColors = {
                  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
                  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
                  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  REJECTED: 'bg-stone-100 text-stone-600 border-stone-200',
                };

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <span className="font-mono text-[10px] font-bold text-stone-500">
                          {req.orderRequestId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[req.status]}`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <h4 className="font-serif font-bold text-stone-900 text-sm">
                          {req.productName}
                        </h4>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-stone-500">
                          <span>Batch: {req.batchNumber}</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700">
                            {req.requestedQuantity} Jar(s) (500g)
                          </span>
                        </div>
                        <p className="text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-[11px] italic">
                          "{req.consumerMessage || 'Interested in direct apiary delivery'}"
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                        <span>Customer: <strong>{req.consumerName}</strong></span>
                        {req.consumerContact && (
                          <span className="font-mono text-stone-700">{req.consumerContact}</span>
                        )}
                      </div>
                    </div>

                    {/* Order Action Buttons */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2 text-xs">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateOrderRequestStatus(req.orderRequestId, 'ACCEPTED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('marketplace.acceptOrderBtn') || 'Accept'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateOrderRequestStatus(req.orderRequestId, 'REJECTED')}
                            className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('marketplace.rejectOrderBtn') || 'Decline'}</span>
                          </button>
                        </>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() => updateOrderRequestStatus(req.orderRequestId, 'COMPLETED')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('marketplace.completeOrderBtn') || 'Mark Completed'}</span>
                        </button>
                      )}

                      {req.status === 'COMPLETED' && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Delivered & Closed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Direct Producer Inquiry & Order Modal */}
      {inquiryProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {t('marketplace.inquiryModalTitle')}
              </span>
              <button
                onClick={() => setInquiryProduct(null)}
                className="text-stone-400 hover:text-stone-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Summary Capsule */}
            <div className="my-4 text-left p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2 text-xs">
              <h4 className="font-serif font-bold text-base text-stone-900">
                {translationService.getLocalizedData(inquiryProduct, language).title}
              </h4>
              <p className="text-stone-600 font-mono">
                Batch: {inquiryProduct.batchId}
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex justify-between font-medium">
                <span>{t('marketplace.unitPriceLabel')}</span>
                <span className="font-bold text-amber-900">₹{inquiryProduct.priceInr} / 500g Jar</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('consumer.producerLabel')}:</span>
                <span className="text-stone-800 font-semibold">{inquiryProduct.beekeeperName}</span>
              </div>
            </div>

            {orderSuccess ? (
              <div className="my-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-serif font-bold text-emerald-900 text-sm">
                  {t('marketplace.orderSuccessMsg') || 'Order Request Submitted!'}
                </p>
                <p className="text-xs text-emerald-700">
                  Your enquiry has been dispatched directly to beekeeper {inquiryProduct.beekeeperName}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendOrderRequest} className="text-left space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.requestedQtyLabel') || 'Quantity (500g Jars)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={inquiryProduct.availableStockBottles || 100}
                    value={consumerQty}
                    onChange={(e) => setConsumerQty(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.consumerNameLabel') || 'Your Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sharma"
                    value={consumerName}
                    onChange={(e) => setConsumerName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.consumerContactLabel') || 'Phone / Email for Delivery Coordination'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98200 12345 or vikram@gmail.com"
                    value={consumerContact}
                    onChange={(e) => setConsumerContact(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.consumerMessageLabel') || 'Message / Delivery Note'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please deliver to Mumbai Khadi Bhavan pickup counter."
                    value={consumerMessage}
                    onChange={(e) => setConsumerMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 text-left space-y-1">
                  <span className="font-semibold text-stone-800 block">{t('marketplace.producerContactTitle')}</span>
                  <p className="flex items-center gap-1.5 text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>{inquiryProduct.contactNumber}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {t('marketplace.prototypeNotice')}
                  </p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryProduct(null)}
                    className="w-1/2 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    {t('marketplace.closeWindowBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="w-1/2 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{orderSubmitting ? 'Sending...' : (t('marketplace.sendOrderRequestBtn') || 'Submit Order Request')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Beekeeper List Batch Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-bold font-serif text-stone-900">
                {t('marketplace.listModalTitle')}
              </h3>
              <button
                onClick={() => setListModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {listError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{listError}</span>
              </div>
            )}

            <form onSubmit={handleListProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('marketplace.selectBatchLabel')}
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {translationService.getLocalizedData(b, language).productName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('marketplace.listingTitleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.pricePerJarLabel')}
                  </label>
                  <input
                    type="number"
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    {t('marketplace.availableStockJarsLabel')}
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  {t('marketplace.descriptionLabel')}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setListModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg font-medium transition-colors shadow-xs cursor-pointer"
                >
                  {t('marketplace.publishListingBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
