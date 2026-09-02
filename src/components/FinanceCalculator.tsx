import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';

type FinanceTab = 'emi' | 'compound' | 'gst' | 'discount' | 'roi';

interface FinanceCalculatorProps {
  settings?: AppSettings;
}

const FINANCE_TABS = ['emi', 'compound', 'gst', 'discount', 'roi'] as const;

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({ settings: _settings }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('emi');

  // EMI State
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(5);

  // Compound Interest State
  const [ciPrincipal, setCiPrincipal] = useState<number>(50000);
  const [ciRate, setCiRate] = useState<number>(7);
  const [ciYears, setCiYears] = useState<number>(10);
  const [ciFreq, setCiFreq] = useState<number>(12); // monthly

  // GST State
  const [gstAmount, setGstAmount] = useState<number>(1000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState<boolean>(false);

  // Discount State
  const [discPrice, setDiscPrice] = useState<number>(250);
  const [discPct, setDiscPct] = useState<number>(20);

  // ROI State
  const [roiInitial, setRoiInitial] = useState<number>(10000);
  const [roiFinal, setRoiFinal] = useState<number>(15000);

  // EMI Calculation
  const calculateEmi = () => {
    const months = tenureYears * 12;
    if (rate === 0) {
      const emi = principal / months;
      return { emi, totalPayable: principal, totalInterest: 0 };
    }
    const r = rate / 12 / 100;
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;
    return { emi, totalPayable, totalInterest };
  };

  const emiRes = calculateEmi();
  const pieDataEmi = [
    { name: 'Principal Amount', value: Math.round(principal), color: '#38bdf8' },
    { name: 'Total Interest', value: Math.round(emiRes.totalInterest), color: '#f43f5e' },
  ];

  // Compound Interest Calculation
  const calculateCompound = () => {
    const amount = ciPrincipal * Math.pow(1 + ciRate / 100 / ciFreq, ciFreq * ciYears);
    const interest = amount - ciPrincipal;
    return { amount, interest };
  };
  const ciRes = calculateCompound();

  // GST Calculation
  const calculateGst = () => {
    if (isInclusive) {
      const original = gstAmount / (1 + gstRate / 100);
      const tax = gstAmount - original;
      return { original, tax, total: gstAmount };
    } else {
      const tax = gstAmount * (gstRate / 100);
      const total = gstAmount + tax;
      return { original: gstAmount, tax, total };
    }
  };
  const gstRes = calculateGst();

  // Discount Calculation
  const savedAmount = discPrice * (discPct / 100);
  const finalPrice = discPrice - savedAmount;

  // ROI Calculation
  const netProfit = roiFinal - roiInitial;
  const roiPct = roiInitial > 0 ? (netProfit / roiInitial) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Finance Sub-Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        role="tablist"
        aria-label="Finance calculator modes"
        onKeyDown={(e) => handleTablistKeydown(e, [...FINANCE_TABS], activeTab, (t) => setActiveTab(t as FinanceTab))}
      >
        {[
          { id: 'emi' as FinanceTab, label: 'Loan EMI' },
          { id: 'compound' as FinanceTab, label: 'Compound Interest' },
          { id: 'gst' as FinanceTab, label: 'GST & Sales Tax' },
          { id: 'discount' as FinanceTab, label: 'Discount & Savings' },
          { id: 'roi' as FinanceTab, label: 'ROI Calculator' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={"fin-tab-" + tab.id}
            aria-selected={activeTab === tab.id}
            aria-controls={"fin-panel-" + tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex-shrink-0
              ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: EMI Calculator */}
      <div role="tabpanel" id="fin-panel-emi" aria-labelledby="fin-tab-emi" tabIndex={0} hidden={activeTab !== 'emi'} className={activeTab !== 'emi' ? 'hidden' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Loan Inputs
            </h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">
                Loan Principal Amount ($)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Loan Tenure (Years)</label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(parseInt(e.target.value) || 1)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Monthly Payment Summary
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <div className="bg-sky-950/60 border border-sky-800/60 rounded-2xl p-4">
                  <div className="text-xs text-sky-400 font-bold uppercase">Monthly EMI</div>
                  <div className="text-3xl font-mono font-bold text-sky-300">
                    ${emiRes.emi.toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block">Total Interest</span>
                    <span className="text-rose-400 font-bold text-base">
                      ${emiRes.totalInterest.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block">Total Payable</span>
                    <span className="text-slate-100 font-bold text-base">
                      ${emiRes.totalPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Breakdown */}
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataEmi}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {pieDataEmi.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      {/* Tab 2: Compound Interest */}
      <div role="tabpanel" id="fin-panel-compound" aria-labelledby="fin-tab-compound" tabIndex={0} hidden={activeTab !== 'compound'} className={activeTab !== 'compound' ? 'hidden' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Compound Investment
            </h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Initial Principal ($)</label>
              <input
                type="number"
                value={ciPrincipal}
                onChange={(e) => setCiPrincipal(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Annual Return Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={ciRate}
                onChange={(e) => setCiRate(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Duration (Years)</label>
              <input
                type="number"
                value={ciYears}
                onChange={(e) => setCiYears(parseInt(e.target.value) || 1)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Compounding Frequency</label>
              <select
                value={ciFreq}
                onChange={(e) => setCiFreq(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-200"
              >
                <option value={12}>Monthly (12/yr)</option>
                <option value={4}>Quarterly (4/yr)</option>
                <option value={2}>Semi-Annually (2/yr)</option>
                <option value={1}>Annually (1/yr)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center gap-6">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Future Growth Projection
            </h3>
            <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-5">
              <div className="text-xs text-emerald-400 font-bold uppercase">Total Future Value</div>
              <div className="text-4xl font-mono font-bold text-emerald-300 mt-1">
                ${ciRes.amount.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 text-xs block">Total Interest Earned</span>
                <span className="text-emerald-400 font-bold text-xl">
                  ${ciRes.interest.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 text-xs block">Initial Deposit</span>
                <span className="text-slate-100 font-bold text-xl">${ciPrincipal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Tab 3: GST / Tax Calculator */}
      <div role="tabpanel" id="fin-panel-gst" aria-labelledby="fin-tab-gst" tabIndex={0} hidden={activeTab !== 'gst'} className={activeTab !== 'gst' ? 'hidden' : 'max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5'}>
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
            GST & Tax Calculation
          </h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Amount ($)</label>
            <input
              type="number"
              value={gstAmount}
              onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Tax Rate (%)</label>
            <input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInclusive(false)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all ${!isInclusive ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              GST Exclusive (Add Tax)
            </button>
            <button
              onClick={() => setIsInclusive(true)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all ${isInclusive ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              GST Inclusive (Extract Tax)
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-4 grid grid-cols-3 gap-3 font-mono text-center">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block uppercase">Net Price</span>
              <span className="text-slate-100 font-bold text-base">
                ${gstRes.original.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-amber-400 block uppercase">Tax ({gstRate}%)</span>
              <span className="text-amber-300 font-bold text-base">${gstRes.tax.toFixed(2)}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-sky-400 block uppercase">Total Price</span>
              <span className="text-sky-300 font-bold text-base">${gstRes.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      {/* Tab 4: Discount Calculator */}
      <div role="tabpanel" id="fin-panel-discount" aria-labelledby="fin-tab-discount" tabIndex={0} hidden={activeTab !== 'discount'} className={activeTab !== 'discount' ? 'hidden' : 'max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5'}>
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
            Discount & Savings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Original Price ($)</label>
              <input
                type="number"
                value={discPrice}
                onChange={(e) => setDiscPrice(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Discount (%)</label>
              <input
                type="number"
                value={discPct}
                onChange={(e) => setDiscPct(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-center pt-2">
            <div className="bg-emerald-950/60 border border-emerald-800/60 p-4 rounded-2xl">
              <span className="text-xs text-emerald-400 font-bold uppercase block">
                Amount Saved
              </span>
              <span className="text-2xl font-bold text-emerald-300">${savedAmount.toFixed(2)}</span>
            </div>
            <div className="bg-sky-950/60 border border-sky-800/60 p-4 rounded-2xl">
              <span className="text-xs text-sky-400 font-bold uppercase block">Final Price</span>
              <span className="text-2xl font-bold text-sky-300">${finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

      {/* Tab 5: ROI Calculator */}
      <div role="tabpanel" id="fin-panel-roi" aria-labelledby="fin-tab-roi" tabIndex={0} hidden={activeTab !== 'roi'} className={activeTab !== 'roi' ? 'hidden' : 'max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5'}>
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
            Return on Investment (ROI)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Initial Investment ($)</label>
              <input
                type="number"
                value={roiInitial}
                onChange={(e) => setRoiInitial(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Final Return Value ($)</label>
              <input
                type="number"
                value={roiFinal}
                onChange={(e) => setRoiFinal(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-center pt-2">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-bold uppercase block">Net Profit</span>
              <span
                className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                ${netProfit.toFixed(2)}
              </span>
            </div>
            <div className="bg-sky-950/60 border border-sky-800/60 p-4 rounded-2xl">
              <span className="text-xs text-sky-400 font-bold uppercase block">ROI (%)</span>
              <span className="text-2xl font-bold text-sky-300">{roiPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
    </div>
  );
};
