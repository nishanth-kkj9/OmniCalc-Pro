import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';

interface FractionsCalculatorProps {
  settings?: AppSettings;
}

export const FractionsCalculator: React.FC<FractionsCalculatorProps> = ({
  settings: _settings,
}) => {
  const [tab, setTab] = useState<'fractions' | 'gcd_lcm' | 'prime'>('fractions');

  // Fraction State
  const [f1Num, setF1Num] = useState<string>('3');
  const [f1Den, setF1Den] = useState<string>('4');
  const [op, setOp] = useState<'+' | '−' | '×' | '÷'>('+');
  const [f2Num, setF2Num] = useState<string>('2');
  const [f2Den, setF2Den] = useState<string>('5');

  // GCD / LCM State
  const [gcdInput, setGcdInput] = useState<string>('48, 180, 24');

  // Prime Analyzer State
  const [primeInput, setPrimeInput] = useState<string>('360');

  // Helper gcd
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  };

  const lcm = (a: number, b: number): number => {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
  };

  // Prime factorization helper
  const getPrimeFactors = (n: number): { base: number; exp: number }[] => {
    n = Math.abs(n);
    const factors: { base: number; exp: number }[] = [];
    if (n <= 1) return factors;

    let d = 2;
    while (d * d <= n) {
      if (n % d === 0) {
        let count = 0;
        while (n % d === 0) {
          count++;
          n /= d;
        }
        factors.push({ base: d, exp: count });
      }
      d = d === 2 ? 3 : d + 2;
    }
    if (n > 1) {
      factors.push({ base: n, exp: 1 });
    }
    return factors;
  };

  // Compute Fractions
  const computeFractions = () => {
    const n1 = parseInt(f1Num) || 0;
    const d1 = parseInt(f1Den) || 1;
    const n2 = parseInt(f2Num) || 0;
    const d2 = parseInt(f2Den) || 1;

    if (d1 === 0 || d2 === 0) {
      return { error: 'Denominator cannot be zero.' };
    }

    let resNum = 0;
    let resDen = 1;
    let step = '';

    if (op === '+') {
      resNum = n1 * d2 + n2 * d1;
      resDen = d1 * d2;
      step = `(${n1} × ${d2} + ${n2} × ${d1}) / (${d1} × ${d2}) = ${resNum} / ${resDen}`;
    } else if (op === '−') {
      resNum = n1 * d2 - n2 * d1;
      resDen = d1 * d2;
      step = `(${n1} × ${d2} - ${n2} × ${d1}) / (${d1} × ${d2}) = ${resNum} / ${resDen}`;
    } else if (op === '×') {
      resNum = n1 * n2;
      resDen = d1 * d2;
      step = `(${n1} × ${n2}) / (${d1} × ${d2}) = ${resNum} / ${resDen}`;
    } else {
      if (n2 === 0) return { error: 'Cannot divide by zero fraction.' };
      resNum = n1 * d2;
      resDen = d1 * n2;
      step = `(${n1} × ${d2}) / (${d1} × ${n2}) = ${resNum} / ${resDen}`;
    }

    if (resDen < 0) {
      resNum = -resNum;
      resDen = -resDen;
    }

    const g = gcd(resNum, resDen);
    const simpNum = resNum / g;
    const simpDen = resDen / g;

    // Mixed number
    let mixed = '';
    const whole = Math.trunc(simpNum / simpDen);
    const rem = Math.abs(simpNum % simpDen);
    if (whole !== 0 && rem !== 0) {
      mixed = `${whole} ${rem}/${simpDen}`;
    }

    const decimal = simpNum / simpDen;

    return {
      simplified: `${simpNum} / ${simpDen}`,
      mixed: mixed || null,
      decimal: (Math.round(decimal * 1000000) / 1000000).toString(),
      step,
    };
  };

  // Compute GCD & LCM
  const computeGcdLcm = () => {
    const nums = gcdInput
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (nums.length < 2) {
      return { error: 'Please enter at least two positive integers separated by commas.' };
    }

    let currentGcd = nums[0];
    let currentLcm = nums[0];

    for (let i = 1; i < nums.length; i++) {
      currentGcd = gcd(currentGcd, nums[i]);
      currentLcm = lcm(currentLcm, nums[i]);
    }

    const factorizations = nums.map((n) => {
      const f = getPrimeFactors(n);
      const str = f.map((x) => (x.exp > 1 ? `${x.base}^${x.exp}` : `${x.base}`)).join(' × ');
      return { num: n, factors: str || '1' };
    });

    return {
      gcd: currentGcd,
      lcm: currentLcm,
      factorizations,
    };
  };

  // Compute Prime
  const computePrime = () => {
    const n = parseInt(primeInput);
    if (isNaN(n) || n < 1) return { error: 'Please enter a positive integer.' };

    const isPrime = (num: number): boolean => {
      if (num <= 1) return false;
      if (num <= 3) return true;
      if (num % 2 === 0 || num % 3 === 0) return false;
      for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
      }
      return true;
    };

    const primeStatus = isPrime(n);

    // Divisors
    const divisors: number[] = [];
    for (let i = 1; i * i <= n; i++) {
      if (n % i === 0) {
        divisors.push(i);
        if (i * i !== n) divisors.push(n / i);
      }
    }
    divisors.sort((a, b) => a - b);
    const sumDivisors = divisors.reduce((acc, v) => acc + v, 0);

    // Factors
    const f = getPrimeFactors(n);
    const primeFactStr =
      f.map((x) => (x.exp > 1 ? `${x.base}^${x.exp}` : `${x.base}`)).join(' × ') ||
      (n === 1 ? '1' : `${n}`);

    // Next prime
    let nextP = n + 1;
    while (!isPrime(nextP)) nextP++;

    // Prev prime
    let prevP: number | null = n - 1;
    while (prevP > 1 && !isPrime(prevP)) prevP--;
    if (prevP <= 1) prevP = null;

    return {
      isPrime: primeStatus,
      primeFactors: primeFactStr,
      divisors,
      numDivisors: divisors.length,
      sumDivisors,
      nextPrime: nextP,
      prevPrime: prevP,
    };
  };

  const fracRes = computeFractions();
  const gcdRes = computeGcdLcm();
  const primeRes = computePrime();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'fractions', label: 'Fraction Arithmetic & Simplifier' },
          { id: 'gcd_lcm', label: 'GCD & LCM (Factor Trees)' },
          { id: 'prime', label: 'Prime Analyzer & Divisors' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as any)}
            className={`
              px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm
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

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* FRACTION ARITHMETIC */}
        {tab === 'fractions' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Fraction Arithmetic & Simplification
                </h3>
                <p className="text-xs text-slate-400">
                  Perform exact fraction operations with mixed numbers and decimal outputs
                </p>
              </div>
              <button
                onClick={() => {
                  setF1Num('3');
                  setF1Den('4');
                  setOp('+');
                  setF2Num('2');
                  setF2Den('5');
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            {/* Visual Fraction Inputs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              {/* Fraction 1 */}
              <div className="flex flex-col items-center gap-1.5 w-24">
                <input
                  type="number"
                  value={f1Num}
                  onChange={(e) => setF1Num(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center font-mono text-lg font-bold text-slate-100"
                />
                <div className="w-full h-1 bg-slate-600 rounded-full" />
                <input
                  type="number"
                  value={f1Den}
                  onChange={(e) => setF1Den(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center font-mono text-lg font-bold text-slate-100"
                />
              </div>

              {/* Operator */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                {(['+', '−', '×', '÷'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOp(o)}
                    className={`w-9 h-9 rounded-xl font-bold text-lg transition-all ${
                      op === o
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>

              {/* Fraction 2 */}
              <div className="flex flex-col items-center gap-1.5 w-24">
                <input
                  type="number"
                  value={f2Num}
                  onChange={(e) => setF2Num(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center font-mono text-lg font-bold text-slate-100"
                />
                <div className="w-full h-1 bg-slate-600 rounded-full" />
                <input
                  type="number"
                  value={f2Den}
                  onChange={(e) => setF2Den(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center font-mono text-lg font-bold text-slate-100"
                />
              </div>
            </div>

            {/* Results */}
            {fracRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {fracRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{fracRes.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400 mb-1">Simplified Fraction</span>
                        <span className="text-3xl font-mono font-bold text-emerald-400">
                          {fracRes.simplified}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400 mb-1">Mixed Number</span>
                        <span className="text-3xl font-mono font-bold text-sky-400">
                          {fracRes.mixed || 'None (< 1)'}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                        <span className="text-xs text-slate-400 mb-1">Decimal Form</span>
                        <span className="text-3xl font-mono font-bold text-amber-400">
                          {fracRes.decimal}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 flex items-center justify-between">
                      <span>Step Calculation:</span>
                      <span className="font-mono text-slate-200">{fracRes.step}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* GCD & LCM */}
        {tab === 'gcd_lcm' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Greatest Common Divisor (GCD) & LCM
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates GCD and LCM with prime factorizations
                </p>
              </div>
              <button
                onClick={() => setGcdInput('48, 180, 24')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">
                Enter Integers (comma or space separated)
              </label>
              <input
                type="text"
                value={gcdInput}
                onChange={(e) => setGcdInput(e.target.value)}
                placeholder="e.g. 48, 180, 24"
                className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {gcdRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {gcdRes.error ? (
                  <div className="text-amber-400 text-xs font-semibold">{gcdRes.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <span className="text-xs text-slate-400 block mb-1">
                          Greatest Common Divisor (GCD / GCF)
                        </span>
                        <span className="text-3xl font-mono font-bold text-emerald-400">
                          {gcdRes.gcd}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <span className="text-xs text-slate-400 block mb-1">
                          Least Common Multiple (LCM)
                        </span>
                        <span className="text-3xl font-mono font-bold text-sky-400">
                          {gcdRes.lcm}
                        </span>
                      </div>
                    </div>

                    {/* Factorizations */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        Prime Factorizations:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {gcdRes.factorizations?.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-200"
                          >
                            <span className="text-sky-400 font-bold">{f.num}</span> = {f.factors}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRIME ANALYZER */}
        {tab === 'prime' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Prime Number Analyzer & Factor Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Tests primality, prime decomposition, and enumerates all divisors
                </p>
              </div>
              <button
                onClick={() => setPrimeInput('360')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example (360)
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-w-sm">
              <label className="text-xs font-bold text-slate-400">Enter Number (N)</label>
              <input
                type="number"
                min="1"
                value={primeInput}
                onChange={(e) => setPrimeInput(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {primeRes && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {primeRes.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{primeRes.error}</div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Primality Status</span>
                        <span
                          className={`text-2xl font-bold ${primeRes.isPrime ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {primeRes.isPrime ? 'Prime Number' : 'Composite Number'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Prime Decomposition</span>
                        <span className="text-lg font-mono font-bold text-sky-400">
                          {primeRes.primeFactors}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">
                          Total Divisors d(N)
                        </span>
                        <span className="text-lg font-mono font-bold text-slate-100">
                          {primeRes.numDivisors}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">
                          Sum of Divisors σ(N)
                        </span>
                        <span className="text-lg font-mono font-bold text-slate-100">
                          {primeRes.sumDivisors}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Previous Prime</span>
                        <span className="text-lg font-mono font-bold text-slate-300">
                          {primeRes.prevPrime || 'None'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Next Prime</span>
                        <span className="text-lg font-mono font-bold text-emerald-400">
                          {primeRes.nextPrime}
                        </span>
                      </div>
                    </div>

                    {/* All Divisors */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        All Positive Divisors of {primeInput}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {primeRes.divisors?.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs rounded-md"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
