import React, { useState } from 'react';
import { Heart, Activity, Flame, Scale, User, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';

interface HealthCalculatorProps {
  settings?: AppSettings;
}

export const HealthCalculator: React.FC<HealthCalculatorProps> = ({ settings }) => {
  const [tab, setTab] = useState<'bmi' | 'tdee' | 'heartrate'>('bmi');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Shared / BMI State
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [heightCm, setHeightCm] = useState<number>(175);
  
  // Imperial fields
  const [weightLbs, setWeightLbs] = useState<number>(160);
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);

  // TDEE State
  const [activity, setActivity] = useState<number>(1.55); // Moderate
  const [goal, setGoal] = useState<'lose' | 'mild_lose' | 'maintain' | 'gain'>('maintain');

  // Resting HR for Karvonen
  const [restingHr, setRestingHr] = useState<number>(65);

  // Synchronize metric & imperial values
  const getActiveMetricValues = () => {
    if (unitSystem === 'metric') {
      return { w: weightKg, h: heightCm };
    } else {
      const totalInches = heightFt * 12 + heightIn;
      const hCm = totalInches * 2.54;
      const wKg = weightLbs * 0.45359237;
      return { w: wKg, h: hCm };
    }
  };

  // BMI Calculation
  const computeBmi = () => {
    const { w, h } = getActiveMetricValues();
    if (!w || !h || h <= 0) return null;

    const hM = h / 100;
    const bmi = w / (hM * hM);
    const minHealthyKg = 18.5 * (hM * hM);
    const maxHealthyKg = 24.9 * (hM * hM);

    let category = 'Normal Weight';
    let colorClass = 'text-emerald-400';
    let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    let percent = 50;

    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'text-sky-400';
      badgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      percent = Math.min(25, (bmi / 18.5) * 25);
    } else if (bmi <= 24.9) {
      category = 'Normal Weight';
      colorClass = 'text-emerald-400';
      badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      percent = 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 25;
    } else if (bmi <= 29.9) {
      category = 'Overweight';
      colorClass = 'text-amber-400';
      badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      percent = 50 + ((bmi - 25) / (29.9 - 25)) * 25;
    } else {
      category = 'Obese';
      colorClass = 'text-rose-400';
      badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      percent = Math.min(100, 75 + ((bmi - 30) / 15) * 25);
    }

    return {
      bmi: (Math.round(bmi * 10) / 10).toFixed(1),
      category,
      colorClass,
      badgeBg,
      percent: Math.max(5, Math.min(95, percent)),
      minHealthy: (Math.round(minHealthyKg * 10) / 10).toFixed(1),
      maxHealthy: (Math.round(maxHealthyKg * 10) / 10).toFixed(1),
    };
  };

  // BMR & TDEE (Mifflin-St Jeor)
  const computeTdee = () => {
    const { w, h } = getActiveMetricValues();
    if (!w || !h || !age) return null;

    let bmr = 10 * w + 6.25 * h - 5 * age;
    bmr += gender === 'male' ? 5 : -161;

    const maintenance = bmr * activity;
    let targetCal = maintenance;
    if (goal === 'mild_lose') targetCal -= 250;
    if (goal === 'lose') targetCal -= 500;
    if (goal === 'gain') targetCal += 350;

    // Macro Split: 30% Protein, 40% Carbs, 30% Fat
    const proteinG = (targetCal * 0.3) / 4;
    const carbsG = (targetCal * 0.4) / 4;
    const fatsG = (targetCal * 0.3) / 9;

    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      targetCal: Math.round(targetCal),
      proteinG: Math.round(proteinG),
      carbsG: Math.round(carbsG),
      fatsG: Math.round(fatsG),
    };
  };

  // Heart Rate Zones (Tanaka Formula & Karvonen)
  const computeHeartRate = () => {
    if (!age || age <= 0) return null;
    const maxHr = Math.round(208 - 0.7 * age);
    const reserve = maxHr - (restingHr || 65);

    const zones = [
      { name: 'Warm Up / Recovery', range: '50% - 60%', min: Math.round(restingHr + reserve * 0.5), max: Math.round(restingHr + reserve * 0.6), color: 'text-sky-400' },
      { name: 'Fat Burning / Aerobic Base', range: '60% - 70%', min: Math.round(restingHr + reserve * 0.6), max: Math.round(restingHr + reserve * 0.7), color: 'text-emerald-400' },
      { name: 'Aerobic Endurance', range: '70% - 80%', min: Math.round(restingHr + reserve * 0.7), max: Math.round(restingHr + reserve * 0.8), color: 'text-amber-400' },
      { name: 'Anaerobic / Lactate Threshold', range: '80% - 90%', min: Math.round(restingHr + reserve * 0.8), max: Math.round(restingHr + reserve * 0.9), color: 'text-orange-400' },
      { name: 'Maximum Effort / VO2 Max', range: '90% - 100%', min: Math.round(restingHr + reserve * 0.9), max: maxHr, color: 'text-rose-400' },
    ];

    return {
      maxHr,
      zones,
    };
  };

  const bmiData = computeBmi();
  const tdeeData = computeTdee();
  const hrData = computeHeartRate();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Top Controls: Tabs & Unit Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { id: 'bmi', label: 'BMI & Body Category' },
            { id: 'tdee', label: 'BMR & TDEE Calories' },
            { id: 'heartrate', label: 'Target Heart Rate Zones' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`
                px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm
                ${tab === item.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setUnitSystem('metric')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              unitSystem === 'metric' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Metric (kg, cm)
          </button>
          <button
            onClick={() => setUnitSystem('imperial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              unitSystem === 'imperial' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Imperial (lbs, ft/in)
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* User Biometrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Gender</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setGender('male')}
                className={`py-1 rounded-lg text-xs font-bold ${gender === 'male' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                Male
              </button>
              <button
                onClick={() => setGender('female')}
                className={`py-1 rounded-lg text-xs font-bold ${gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}
              >
                Female
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 25)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
            />
          </div>

          {unitSystem === 'metric' ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Weight (lbs)</label>
                <input
                  type="number"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Height (ft & in)</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    placeholder="ft"
                    value={heightFt}
                    onChange={(e) => setHeightFt(parseInt(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                  <input
                    type="number"
                    placeholder="in"
                    value={heightIn}
                    onChange={(e) => setHeightIn(parseInt(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* BMI SECTION */}
        {tab === 'bmi' && bmiData && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Body Mass Index (BMI)</h3>
                <p className="text-xs text-slate-400">Standard WHO weight-for-height classification</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bmiData.badgeBg}`}>
                {bmiData.category}
              </span>
            </div>

            {/* Score & Visual Gauge */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your BMI Score</span>
              <span className={`text-6xl font-mono font-bold ${bmiData.colorClass}`}>{bmiData.bmi}</span>

              {/* Progress Bar Gauge */}
              <div className="w-full max-w-md flex flex-col gap-1.5">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                  <div className="w-1/4 bg-sky-500" title="Underweight (< 18.5)" />
                  <div className="w-1/4 bg-emerald-500" title="Normal (18.5 - 24.9)" />
                  <div className="w-1/4 bg-amber-500" title="Overweight (25 - 29.9)" />
                  <div className="w-1/4 bg-rose-500" title="Obese (≥ 30)" />
                  {/* Indicator marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md transition-all duration-300"
                    style={{ left: `${bmiData.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Underweight</span>
                  <span>18.5 (Normal)</span>
                  <span>25.0 (Over)</span>
                  <span>30.0 (Obese)</span>
                </div>
              </div>
            </div>

            {/* Ideal weight range */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-300">
              <span>Healthy Weight Range for your height:</span>
              <span className="font-mono font-bold text-emerald-400">
                {bmiData.minHealthy} kg – {bmiData.maxHealthy} kg
              </span>
            </div>
          </div>
        )}

        {/* TDEE SECTION */}
        {tab === 'tdee' && tdeeData && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">BMR & Daily Energy Expenditure (TDEE)</h3>
              <p className="text-xs text-slate-400">Calculates basal metabolic rate and daily calorie targets based on your goals</p>
            </div>

            {/* Activity & Goal Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Daily Activity Level</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(parseFloat(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-200"
                >
                  <option value={1.2}>Sedentary (Little or no exercise)</option>
                  <option value={1.375}>Lightly Active (1-3 days/wk workout)</option>
                  <option value={1.55}>Moderately Active (3-5 days/wk workout)</option>
                  <option value={1.725}>Very Active (6-7 days/wk intense)</option>
                  <option value={1.9}>Extra Active (Physical job / athlete)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Fitness Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-200"
                >
                  <option value="maintain">Maintain Current Weight</option>
                  <option value="mild_lose">Mild Weight Loss (-0.25 kg/wk)</option>
                  <option value="lose">Standard Fat Loss (-0.5 kg/wk)</option>
                  <option value="gain">Lean Muscle Building (+0.35 kg/wk)</option>
                </select>
              </div>
            </div>

            {/* Target Calorie Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Basal Metabolic Rate (BMR)</span>
                <span className="text-2xl font-mono font-bold text-slate-200">{tdeeData.bmr}</span>
                <span className="text-[11px] text-slate-500 block">kcal/day at rest</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Maintenance (TDEE)</span>
                <span className="text-2xl font-mono font-bold text-sky-400">{tdeeData.maintenance}</span>
                <span className="text-[11px] text-slate-500 block">kcal/day</span>
              </div>
              <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Recommended Goal Target</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">{tdeeData.targetCal}</span>
                <span className="text-[11px] text-emerald-500/80 block">kcal/day</span>
              </div>
            </div>

            {/* Macro Breakdown */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Daily Macronutrient Split</span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block">Protein (30%)</span>
                  <span className="text-xl font-mono font-bold text-sky-400">{tdeeData.proteinG}g</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block">Carbohydrates (40%)</span>
                  <span className="text-xl font-mono font-bold text-amber-400">{tdeeData.carbsG}g</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block">Fats (30%)</span>
                  <span className="text-xl font-mono font-bold text-pink-400">{tdeeData.fatsG}g</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEART RATE SECTION */}
        {tab === 'heartrate' && hrData && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Cardiovascular Target Heart Rate Zones</h3>
                <p className="text-xs text-slate-400">Calculated with Tanaka Maximum HR and Karvonen Heart Rate Reserve</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Resting HR:</label>
                <input
                  type="number"
                  value={restingHr}
                  onChange={(e) => setRestingHr(parseInt(e.target.value) || 60)}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-xl p-1.5 font-mono text-xs text-center font-bold text-slate-100"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Estimated Maximum Heart Rate (HR_max):</span>
              <span className="text-xl font-mono font-bold text-rose-400">{hrData.maxHr} BPM</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {hrData.zones.map((z, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{z.name}</span>
                    <span className="text-[11px] text-slate-500">Intensity: {z.range}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-mono font-bold ${z.color}`}>
                      {z.min} – {z.max} BPM
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
