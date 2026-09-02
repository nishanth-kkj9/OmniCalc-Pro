import React, { useState } from 'react';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';

interface DateTimeCalculatorProps {
  settings?: AppSettings;
}

const DATETIME_TABS = ['diff', 'addsub', 'age', 'worktime'] as const;

function parseLocalDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DateTimeCalculator: React.FC<DateTimeCalculatorProps> = ({ settings: _settings }) => {
  const [tab, setTab] = useState<'diff' | 'addsub' | 'age' | 'worktime'>('diff');

  // Today ISO in local timezone
  const todayStr = formatLocalDate(new Date());

  // Date Diff State
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return formatLocalDate(future);
  });

  // Add / Sub State
  const [baseDate, setBaseDate] = useState<string>(todayStr);
  const [opType, setOpType] = useState<'add' | 'sub'>('add');
  const [addYears, setAddYears] = useState<number>(0);
  const [addMonths, setAddMonths] = useState<number>(0);
  const [addWeeks, setAddWeeks] = useState<number>(0);
  const [addDays, setAddDays] = useState<number>(14);

  // Age State
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');

  // Work Time State
  const [workStart, setWorkStart] = useState<string>('09:00');
  const [workEnd, setWorkEnd] = useState<string>('17:30');
  const [breakMins, setBreakMins] = useState<number>(45);
  const [hourlyRate, setHourlyRate] = useState<number>(25);

  // Compute Date Difference
  const computeDateDiff = () => {
    const d1 = parseLocalDate(startDate);
    const d2 = parseLocalDate(endDate);
    if (!d1 || !d2) return null;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    // Working days (Monday - Friday)
    let workDays = 0;
    const cur = new Date(Math.min(d1.getTime(), d2.getTime()));
    const target = new Date(Math.max(d1.getTime(), d2.getTime()));
    while (cur <= target) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        workDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Detailed Breakdown (Y, M, D)
    const early = d1 < d2 ? d1 : d2;
    const late = d1 < d2 ? d2 : d1;
    let y = late.getFullYear() - early.getFullYear();
    let m = late.getMonth() - early.getMonth();
    let d = late.getDate() - early.getDate();
    if (d < 0) {
      m--;
      const prevMonth = new Date(late.getFullYear(), late.getMonth(), 0);
      d += prevMonth.getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }

    return {
      totalDays,
      breakdown: `${y} years, ${m} months, ${d} days`,
      weeksFormat: `${totalWeeks} weeks and ${remDays} days`,
      workDays,
      totalHours: totalHours.toLocaleString(),
      totalMinutes: totalMinutes.toLocaleString(),
      totalSeconds: totalSeconds.toLocaleString(),
    };
  };

  // Add / Subtract Calculation
  const computeAddSub = () => {
    const d = parseLocalDate(baseDate);
    if (!d) return null;

    const mult = opType === 'add' ? 1 : -1;
    const res = new Date(d);

    res.setFullYear(res.getFullYear() + mult * addYears);
    res.setMonth(res.getMonth() + mult * addMonths);
    res.setDate(res.getDate() + mult * (addWeeks * 7 + addDays));

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return {
      iso: formatLocalDate(res),
      formatted: res.toLocaleDateString(undefined, options),
    };
  };

  // Age Calculator
  const computeAge = () => {
    const dob = parseLocalDate(birthDate);
    const now = new Date();
    if (!dob) return null;

    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    let d = now.getDate() - dob.getDate();
    if (d < 0) {
      m--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      d += prevMonth.getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }

    const totalDaysLived = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));

    // Next Birthday
    const nextBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday < now) {
      nextBday.setFullYear(nextBday.getFullYear() + 1);
    }
    const daysUntilBday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ageStr: `${y} Years, ${m} Months, ${d} Days`,
      totalDaysLived: totalDaysLived.toLocaleString(),
      daysUntilBday,
      nextBdayFormatted: nextBday.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  };

  // Work Hours Calculation
  const computeWorkHours = () => {
    const [h1, m1] = workStart.split(':').map(Number);
    const [h2, m2] = workEnd.split(':').map(Number);

    const startMins = h1 * 60 + m1;
    let endMins = h2 * 60 + m2;
    if (endMins < startMins) endMins += 24 * 60; // Next day shift

    const totalSpanMins = endMins - startMins;
    const netMins = Math.max(0, totalSpanMins - (breakMins || 0));
    const netHours = netMins / 60;
    const earnings = netHours * (hourlyRate || 0);

    const fullH = Math.floor(netMins / 60);
    const remM = netMins % 60;

    return {
      netTimeStr: `${fullH}h ${remM}m`,
      decimalHours: (Math.round(netHours * 100) / 100).toFixed(2),
      earnings: earnings.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  };

  const diffRes = computeDateDiff();
  const addSubRes = computeAddSub();
  const ageRes = computeAge();
  const workRes = computeWorkHours();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        role="tablist"
        aria-label="Date and time calculator modes"
        onKeyDown={(e) => handleTablistKeydown(e, [...DATETIME_TABS], tab, (t) => setTab(t as any))}
      >
        {[
          { id: 'diff', label: 'Date Difference & Working Days' },
          { id: 'addsub', label: 'Add / Subtract Time' },
          { id: 'age', label: 'Age & Birthday Countdown' },
          { id: 'worktime', label: 'Work Hours & Wage Tracker' },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            id={"dt-tab-" + item.id}
            aria-selected={tab === item.id}
            aria-controls={"dt-panel-" + item.id}
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

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* DATE DIFFERENCE */}
        <div role="tabpanel" id="dt-panel-diff" aria-labelledby="dt-tab-diff" tabIndex={0} hidden={tab !== 'diff'} className={tab !== 'diff' ? 'hidden' : 'flex flex-col gap-6'}>
            <div>
              <h3 className="text-base font-bold text-slate-100">Date Difference Calculator</h3>
              <p className="text-xs text-slate-400">
                Calculates precise calendar duration, working business days, and total hours
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-base font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-base font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {diffRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 block mb-1">Total Calendar Days</span>
                    <span className="text-3xl font-mono font-bold text-emerald-400">
                      {diffRes.totalDays} Days
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">{diffRes.weeksFormat}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 block mb-1">
                      Business / Working Days
                    </span>
                    <span className="text-3xl font-mono font-bold text-sky-400">
                      {diffRes.workDays} Work Days
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Excludes Saturdays & Sundays
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">
                    Exact Age / Span Breakdown:
                  </span>
                  <span className="text-lg font-bold text-slate-100">{diffRes.breakdown}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-800 pt-3">
                  <div className="p-2 bg-slate-900/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Hours</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {diffRes.totalHours} hrs
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Minutes</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {diffRes.totalMinutes} min
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Seconds</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {diffRes.totalSeconds} s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* ADD / SUBTRACT TIME */}
        <div role="tabpanel" id="dt-panel-addsub" aria-labelledby="dt-tab-addsub" tabIndex={0} hidden={tab !== 'addsub'} className={tab !== 'addsub' ? 'hidden' : 'flex flex-col gap-6'}>
            <div>
              <h3 className="text-base font-bold text-slate-100">Add or Subtract from Date</h3>
              <p className="text-xs text-slate-400">
                Calculate future or past deadlines with days, weeks, months, or years offset
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Starting Date</label>
                <input
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-base font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Operation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOpType('add')}
                    className={`p-3 rounded-2xl font-bold text-sm transition-all border ${
                      opType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    + Add Time
                  </button>
                  <button
                    onClick={() => setOpType('sub')}
                    className={`p-3 rounded-2xl font-bold text-sm transition-all border ${
                      opType === 'sub'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    − Subtract Time
                  </button>
                </div>
              </div>
            </div>

            {/* Offset inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Years', val: addYears, set: setAddYears },
                { label: 'Months', val: addMonths, set: setAddMonths },
                { label: 'Weeks', val: addWeeks, set: setAddWeeks },
                { label: 'Days', val: addDays, set: setAddDays },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">{item.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={item.val}
                    onChange={(e) => item.set(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              ))}
            </div>

            {addSubRes && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Calculated Date
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-sky-400">
                  {addSubRes.formatted}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  ISO Format: {addSubRes.iso}
                </span>
              </div>
            )}
          </div>

        {/* AGE CALCULATOR */}
        <div role="tabpanel" id="dt-panel-age" aria-labelledby="dt-tab-age" tabIndex={0} hidden={tab !== 'age'} className={tab !== 'age' ? 'hidden' : 'flex flex-col gap-6'}>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Chronological Age & Birthday Countdown
              </h3>
              <p className="text-xs text-slate-400">
                Calculates exact life milestones and days until next celebration
              </p>
            </div>

            <div className="flex flex-col gap-1.5 max-w-sm">
              <label className="text-xs font-bold text-slate-400">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-base font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {ageRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">Exact Age</span>
                  <span className="text-3xl font-bold text-emerald-400">{ageRes.ageStr}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 block mb-1">Total Days Lived</span>
                    <span className="text-2xl font-mono font-bold text-sky-400">
                      {ageRes.totalDaysLived} Days
                    </span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 block mb-1">
                      Next Birthday Countdown
                    </span>
                    <span className="text-2xl font-bold text-amber-400">
                      {ageRes.daysUntilBday} Days Left
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      {ageRes.nextBdayFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* WORK HOURS */}
        <div role="tabpanel" id="dt-panel-worktime" aria-labelledby="dt-tab-worktime" tabIndex={0} hidden={tab !== 'worktime'} className={tab !== 'worktime' ? 'hidden' : 'flex flex-col gap-6'}>
            <div>
              <h3 className="text-base font-bold text-slate-100">Work Hours & Wage Calculator</h3>
              <p className="text-xs text-slate-400">
                Calculate net billable hours, lunch break deductions, and estimated shift pay
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Start Shift</label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">End Shift</label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Break (Mins)</label>
                <input
                  type="number"
                  min="0"
                  value={breakMins}
                  onChange={(e) => setBreakMins(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Hourly Rate ($)</label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
            </div>

            {workRes && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Net Work Time</span>
                  <span className="text-2xl font-bold text-slate-100">{workRes.netTimeStr}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Decimal Hours</span>
                  <span className="text-2xl font-mono font-bold text-sky-400">
                    {workRes.decimalHours} hrs
                  </span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Estimated Earnings</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    ${workRes.earnings}
                  </span>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
