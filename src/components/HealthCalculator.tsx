import React, { useState } from 'react';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';

interface HealthCalculatorProps {
  settings?: AppSettings;
}

const HEALTH_TABS = ['bmi', 'bmr_tdee', 'heart_rate'] as const;

export const HealthCalculator: React.FC<HealthCalculatorProps> = ({ settings: _settings }) => {
  const [tab, setTab] = useState<'bmi' | 'bmr_tdee' | 'heart_rate'>('bmi');

  // BMI State
  const [bmiUnit, setBmiUnit] = useState<'metric' | 'imperial'>('metric');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightLbs, setWeightLbs] = useState<number>(154);
  const [heightIn, setHeightIn] = useState<number>(69);

  // BMR & TDEE State
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(25);
  const [activity, setActivity] = useState<number>(1.375); // Lightly active

  // Target Heart Rate State
  const [hrAge, setHrAge] = useState<number>(30);
  const [restingHr, setRestingHr] = useState<number>(65);

  // BMI Calculation
  const calculateBmi = () => {
    let bmi = 0;
    if (bmiUnit === 'metric') {
      const hM = heightCm / 100;
      if (hM > 0) bmi = weightKg / (hM * hM);
    } else {
      if (heightIn > 0) bmi = (703 * weightLbs) / (heightIn * heightIn);
    }

    let category = '';
    let colorClass = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'text-amber-400';
    } else if (bmi < 24.9) {
      category = 'Normal weight (Healthy)';
      colorClass = 'text-emerald-400';
    } else if (bmi < 29.9) {
      category = 'Overweight';
      colorClass = 'text-yellow-400';
    } else {
      category = 'Obese';
      colorClass = 'text-rose-400';
    }

    return { bmi: Math.round(bmi * 10) / 10, category, colorClass };
  };

  // BMR Calculation (Mifflin-St Jeor)
  const calculateBmrTdee = () => {
    let bmr = 0;
    if (bmiUnit === 'metric') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
    } else {
      const wKg = weightLbs * 0.453592;
      const hCm = heightIn * 2.54;
      bmr = 10 * wKg + 6.25 * hCm - 5 * age + (gender === 'male' ? 5 : -161);
    }

    const tdee = bmr * activity;
    const deficit500 = tdee - 500; // ~1 lb/week loss
    const surplus500 = tdee + 500; // ~1 lb/week gain

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      deficit500: Math.round(deficit500),
      surplus500: Math.round(surplus500),
    };
  };

  // Heart Rate Calculation (Karvonen Formula)
  const calculateHeartRate = () => {
    const maxHr = 220 - hrAge;
    const hrr = maxHr - restingHr; // Heart Rate Reserve

    const zones = [
      { name: 'Warm-up / Light (50-60%)', min: restingHr + hrr * 0.5, max: restingHr + hrr * 0.6 },
      {
        name: 'Fat Burn / Aerobic (60-70%)',
        min: restingHr + hrr * 0.6,
        max: restingHr + hrr * 0.7,
      },
      { name: 'Endurance / Cardio (70-80%)', min: restingHr + hrr * 0.7, max: restingHr + hrr * 0.8 },
      { name: 'Anaerobic / Hard (80-90%)', min: restingHr + hrr * 0.8, max: restingHr + hrr * 0.9 },
      { name: 'Peak / Maximum (90-100%)', min: restingHr + hrr * 0.9, max: maxHr },
    ];

    return { maxHr, zones };
  };

  const bmiRes = calculateBmi();
  const bmrRes = calculateBmrTdee();
  const hrRes = calculateHeartRate();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Sub-tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        role="tablist"
        aria-label="Health calculator modes"
        onKeyDown={(e) => handleTablistKeydown(e, [...HEALTH_TABS], tab, setTab as (tab: string) => void)}
      >
        {[
          { id: 'bmi', label: 'Body Mass Index (BMI)' },
          { id: 'bmr_tdee', label: 'Calorie Needs (BMR & TDEE)' },
          { id: 'heart_rate', label: 'Target Heart Rate Zones' },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`health-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`health-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm flex-shrink-0
              ${
                tab === item.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* BMI */}
        <div role="tabpanel" id="health-panel-bmi" aria-labelledby="health-tab-bmi" hidden={tab !== 'bmi'} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Body Mass Index (BMI)</h3>
                <p className="text-xs text-slate-400">Standard WHO weight category estimator</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setBmiUnit('metric')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bmiUnit === 'metric' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                >
                  Metric (kg/cm)
                </button>
                <button
                  onClick={() => setBmiUnit('imperial')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bmiUnit === 'imperial' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                >
                  Imperial (lbs/in)
                </button>
              </div>
            </div>

            {bmiUnit === 'metric' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Weight (lbs)</label>
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Height (inches)</label>
                  <input
                    type="number"
                    value={heightIn}
                    onChange={(e) => setHeightIn(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Calculated BMI</span>
              <span className={`text-5xl font-mono font-bold ${bmiRes.colorClass}`}>
                {bmiRes.bmi}
              </span>
              <span className={`text-sm font-bold ${bmiRes.colorClass}`}>{bmiRes.category}</span>
            </div>
          </div>

        {/* BMR & TDEE */}
        <div role="tabpanel" id="health-panel-bmr_tdee" aria-labelledby="health-tab-bmr_tdee" hidden={tab !== 'bmr_tdee'} className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Basal Metabolic Rate & TDEE Daily Calories
              </h3>
              <p className="text-xs text-slate-400">
                Mifflin-St Jeor daily energy expenditure and goal thresholds
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Biological Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm font-bold text-slate-200"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Activity Level</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(parseFloat(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-200"
                >
                  <option value={1.2}>Sedentary (Little or no exercise)</option>
                  <option value={1.375}>Lightly Active (1-3 days/wk)</option>
                  <option value={1.55}>Moderately Active (3-5 days/wk)</option>
                  <option value={1.725}>Very Active (6-7 days/wk)</option>
                  <option value={1.9}>Extra Active (Physical job/training)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block">BMR (At Rest)</span>
                <span className="text-xl font-mono font-bold text-slate-100">
                  {bmrRes.bmr} kcal
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block">TDEE (Maintenance)</span>
                <span className="text-xl font-mono font-bold text-sky-400">
                  {bmrRes.tdee} kcal
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block">Weight Loss (-500)</span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  {bmrRes.deficit500} kcal
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block">Weight Gain (+500)</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {bmrRes.surplus500} kcal
                </span>
              </div>
            </div>
          </div>

        {/* HEART RATE */}
        <div role="tabpanel" id="health-panel-heart_rate" aria-labelledby="health-tab-heart_rate" hidden={tab !== 'heart_rate'} className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Karvonen Target Heart Rate</h3>
              <p className="text-xs text-slate-400">
                Exercise intensity zones calculated using Heart Rate Reserve (HRR)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Age</label>
                <input
                  type="number"
                  value={hrAge}
                  onChange={(e) => setHrAge(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">
                  Resting Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  value={restingHr}
                  onChange={(e) => setRestingHr(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Max Heart Rate: <span className="text-rose-400">{hrRes.maxHr} BPM</span>
              </div>

              <div className="space-y-2">
                {hrRes.zones.map((z, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-300 font-bold">{z.name}</span>
                    <span className="text-sky-400 font-bold">
                      {Math.round(z.min)} - {Math.round(z.max)} BPM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
