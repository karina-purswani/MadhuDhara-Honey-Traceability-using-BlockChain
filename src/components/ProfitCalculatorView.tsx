import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ProfitCalculationInput, ProfitCalculationResult } from '../../shared/types';
import { 
  Calculator, 
  IndianRupee, 
  TrendingUp, 
  HelpCircle, 
  Info,
  CheckCircle2,
  PieChart
} from 'lucide-react';

export const ProfitCalculatorView: React.FC = () => {
  const { t } = useLanguage();

  const [inputs, setInputs] = useState<ProfitCalculationInput>({
    numberOfHives: 20,
    expectedYieldPerHiveKg: 10,
    sellingPricePerKg: 400,
    packagingCostPerKg: 35,
    transportCostPerKg: 15,
    processingCostPerKg: 20,
    equipmentMaintenancePerHive: 250,
    feedingOtherCosts: 1800,
  });

  const handleInputChange = (field: keyof ProfitCalculationInput, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  // Calculations
  const totalHoneyKg = inputs.numberOfHives * inputs.expectedYieldPerHiveKg;
  const grossRevenue = totalHoneyKg * inputs.sellingPricePerKg;

  const variableCosts = totalHoneyKg * (inputs.packagingCostPerKg + inputs.transportCostPerKg + inputs.processingCostPerKg);
  const fixedCosts = (inputs.numberOfHives * inputs.equipmentMaintenancePerHive) + inputs.feedingOtherCosts;
  const totalCosts = variableCosts + fixedCosts;

  const netProfit = grossRevenue - totalCosts;
  const profitPerHive = inputs.numberOfHives > 0 ? Math.round(netProfit / inputs.numberOfHives) : 0;
  const costPerKg = totalHoneyKg > 0 ? Math.round((totalCosts / totalHoneyKg) * 10) / 10 : 0;
  const marginPercent = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B24] uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-[#7A4B24]" />
          <span>{t('profit.badge')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
          {t('profit.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          {t('profit.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Parameter Sliders & Inputs */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
            {t('profit.inputsTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Number of Hives */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.numHives')}</span>
                <span className="font-mono font-bold text-[#7A4B24] text-sm">{inputs.numberOfHives}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={inputs.numberOfHives}
                onChange={(e) => handleInputChange('numberOfHives', Number(e.target.value))}
                className="w-full accent-[#7A4B24] cursor-pointer"
              />
            </div>

            {/* Honey per Hive */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.yieldPerHive')}</span>
                <span className="font-mono font-bold text-[#7A4B24] text-sm">{inputs.expectedYieldPerHiveKg} {t('common.kg')}</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                value={inputs.expectedYieldPerHiveKg}
                onChange={(e) => handleInputChange('expectedYieldPerHiveKg', Number(e.target.value))}
                className="w-full accent-[#7A4B24] cursor-pointer"
              />
            </div>

            {/* Selling Price */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.sellingPrice')}</span>
                <span className="font-mono font-bold text-[#7A4B24] text-sm">₹{inputs.sellingPricePerKg}</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="25"
                value={inputs.sellingPricePerKg}
                onChange={(e) => handleInputChange('sellingPricePerKg', Number(e.target.value))}
                className="w-full accent-[#7A4B24] cursor-pointer"
              />
            </div>

            {/* Packaging Cost */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.packagingCost')}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">₹{inputs.packagingCostPerKg}</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={inputs.packagingCostPerKg}
                onChange={(e) => handleInputChange('packagingCostPerKg', Number(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer"
              />
            </div>

            {/* Extraction Cost */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.processingCost')}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">₹{inputs.processingCostPerKg}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={inputs.processingCostPerKg}
                onChange={(e) => handleInputChange('processingCostPerKg', Number(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer"
              />
            </div>

            {/* Transport Cost */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.transportCost')}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">₹{inputs.transportCostPerKg}</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={inputs.transportCostPerKg}
                onChange={(e) => handleInputChange('transportCostPerKg', Number(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer"
              />
            </div>

            {/* Equipment Maintenance per Hive */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.maintenanceCost')}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">₹{inputs.equipmentMaintenancePerHive}</span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="25"
                value={inputs.equipmentMaintenancePerHive}
                onChange={(e) => handleInputChange('equipmentMaintenancePerHive', Number(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer"
              />
            </div>

            {/* Seasonal Feeding & Medicines */}
            <div>
              <div className="flex justify-between font-medium text-stone-700 mb-1.5">
                <span>{t('profit.feedingCost')}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">₹{inputs.feedingOtherCosts}</span>
              </div>
              <input
                type="range"
                min="500"
                max="6000"
                step="100"
                value={inputs.feedingOtherCosts}
                onChange={(e) => handleInputChange('feedingOtherCosts', Number(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>{t('profit.totalExpectedProduction')} <strong className="text-stone-900 font-mono">{totalHoneyKg} {t('common.kg')}</strong></span>
            <span>{t('profit.productionCostPerKg')} <strong className="text-stone-900 font-mono">₹{costPerKg}</strong></span>
          </div>
        </div>

        {/* Right Col: Profit Outcomes Card */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F4C542] block">
              {t('profit.netEconomicsBadge')}
            </span>

            {/* Net Profit */}
            <div className="pb-4 border-b border-stone-800">
              <span className="text-xs text-stone-400 block">{t('profit.netProfitLabel')}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-white">
                  ₹{netProfit.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-400 font-semibold font-mono">
                  {marginPercent}% {t('profit.marginLabel')}
                </span>
              </div>
            </div>

            {/* Breakdown Items */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>{t('profit.grossRevenueLabel')}</span>
                <span className="font-mono font-semibold text-white">
                  ₹{grossRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>{t('profit.totalExpensesLabel')}</span>
                <span className="font-mono text-rose-300">
                  -₹{totalCosts.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-stone-300 pt-2 border-t border-stone-800">
                <span>{t('profit.netProfitPerHiveLabel')}</span>
                <span className="font-mono font-bold text-[#F4C542]">
                  ₹{profitPerHive.toLocaleString('en-IN')} {t('common.perHive')}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-stone-800/80 rounded-xl text-[11px] text-stone-300 space-y-1">
                <div className="flex items-center gap-1.5 text-[#F4C542] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('profit.kvicAdvantageTitle')}</span>
                </div>
                <p className="text-stone-400 leading-relaxed">
                  {t('profit.kvicAdvantageDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('profit.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
