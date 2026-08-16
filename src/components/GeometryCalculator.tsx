import React, { useState } from 'react';
import { Triangle, Circle, Box, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface GeometryCalculatorProps {
  settings: AppSettings;
}

export const GeometryCalculator: React.FC<GeometryCalculatorProps> = ({ settings }) => {
  const [tab, setTab] = useState<'triangle' | '2d_shapes' | '3d_shapes'>('triangle');
  const [copied, setCopied] = useState<string | null>(null);

  // Triangle State (Sides a, b, c)
  const [sideA, setSideA] = useState<string>('5');
  const [sideB, setSideB] = useState<string>('6');
  const [sideC, setSideC] = useState<string>('7');

  // 2D Shapes State
  const [shape2D, setShape2D] = useState<'circle' | 'sector' | 'ellipse' | 'trapezoid' | 'polygon'>('circle');
  const [val2D1, setVal2D1] = useState<string>('5'); // radius / a / base1
  const [val2D2, setVal2D2] = useState<string>('8'); // angle / b / base2
  const [val2D3, setVal2D3] = useState<string>('4'); // height / sides

  // 3D Shapes State
  const [shape3D, setShape3D] = useState<'sphere' | 'cylinder' | 'cone' | 'prism' | 'pyramid'>('cylinder');
  const [val3D1, setVal3D1] = useState<string>('4'); // radius / length
  const [val3D2, setVal3D2] = useState<string>('10'); // height / width
  const [val3D3, setVal3D3] = useState<string>('6'); // height for prism

  const formatNum = (n: number) => {
    if (Math.abs(n) < 1e-12) return '0';
    const prec = settings.precision || 6;
    return Number(n.toFixed(prec)).toString();
  };

  // Solve Triangle by 3 sides (SSS)
  const solveTriangle = () => {
    const a = parseFloat(sideA);
    const b = parseFloat(sideB);
    const c = parseFloat(sideC);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a <= 0 || b <= 0 || c <= 0) {
      return { error: 'Please enter positive values for all 3 sides.' };
    }

    // Triangle inequality
    if (a + b <= c || a + c <= b || b + c <= a) {
      return { error: 'Invalid triangle: the sum of any two sides must be strictly greater than the third side.' };
    }

    // Law of Cosines
    // cos(A) = (b^2 + c^2 - a^2) / (2bc)
    const cosAlpha = (b * b + c * c - a * a) / (2 * b * c);
    const cosBeta = (a * a + c * c - b * b) / (2 * a * c);
    const cosGamma = (a * a + b * b - c * c) / (2 * a * b);

    const radAlpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
    const radBeta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
    const radGamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));

    const degAlpha = (radAlpha * 180) / Math.PI;
    const degBeta = (radBeta * 180) / Math.PI;
    const degGamma = (radGamma * 180) / Math.PI;

    // Perimeter & Area (Heron's)
    const p = a + b + c;
    const s = p / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));

    // Inradius & Circumradius
    const inradius = s > 0 ? area / s : 0;
    const circumradius = area > 0 ? (a * b * c) / (4 * area) : 0;

    // Triangle coordinates for SVG rendering (scaled into 260x180 box)
    // Place vertex A at (0,0), vertex B at (c, 0), vertex C at (b*cos(A), b*sin(A))
    const cx = b * Math.cos(radAlpha);
    const cy = b * Math.sin(radAlpha);

    const minX = Math.min(0, c, cx);
    const maxX = Math.max(0, c, cx);
    const minY = Math.min(0, cy);
    const maxY = Math.max(0, cy);

    const spanX = Math.max(0.1, maxX - minX);
    const spanY = Math.max(0.1, maxY - minY);
    const scale = Math.min(200 / spanX, 120 / spanY);

    const padX = 30;
    const padY = 140;

    const pA = { x: padX + (0 - minX) * scale, y: padY - (0 - minY) * scale };
    const pB = { x: padX + (c - minX) * scale, y: padY - (0 - minY) * scale };
    const pC = { x: padX + (cx - minX) * scale, y: padY - (cy - minY) * scale };

    return {
      a: formatNum(a),
      b: formatNum(b),
      c: formatNum(c),
      alphaDeg: `${formatNum(degAlpha)}°`,
      betaDeg: `${formatNum(degBeta)}°`,
      gammaDeg: `${formatNum(degGamma)}°`,
      perimeter: formatNum(p),
      semiPerimeter: formatNum(s),
      area: formatNum(area),
      inradius: formatNum(inradius),
      circumradius: formatNum(circumradius),
      svgPoints: `${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`,
      pA,
      pB,
      pC,
    };
  };

  // Solve 2D Shapes
  const solve2D = () => {
    const v1 = parseFloat(val2D1) || 0;
    const v2 = parseFloat(val2D2) || 0;
    const v3 = parseFloat(val2D3) || 0;

    if (shape2D === 'circle') {
      const r = v1;
      const area = Math.PI * r * r;
      const circ = 2 * Math.PI * r;
      return [
        { label: 'Circumference (C = 2πr)', value: formatNum(circ) },
        { label: 'Area (A = πr²)', value: formatNum(area) },
        { label: 'Diameter (d = 2r)', value: formatNum(2 * r) },
      ];
    } else if (shape2D === 'sector') {
      const r = v1;
      const thetaDeg = v2;
      const thetaRad = (thetaDeg * Math.PI) / 180;
      const arcLen = r * thetaRad;
      const area = 0.5 * r * r * thetaRad;
      const perim = arcLen + 2 * r;
      return [
        { label: 'Arc Length (L = r·θ)', value: formatNum(arcLen) },
        { label: 'Sector Area (A = 0.5·r²·θ)', value: formatNum(area) },
        { label: 'Total Perimeter (L + 2r)', value: formatNum(perim) },
      ];
    } else if (shape2D === 'ellipse') {
      const a = v1, b = v2;
      const area = Math.PI * a * b;
      // Ramanujan approx for circumference
      const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
      const circ = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      return [
        { label: 'Area (A = πab)', value: formatNum(area) },
        { label: 'Circumference (Ramanujan approx)', value: formatNum(circ) },
        { label: 'Eccentricity (e = √(1 - b²/a²))', value: a >= b ? formatNum(Math.sqrt(1 - (b * b) / (a * a))) : 'N/A' },
      ];
    } else if (shape2D === 'trapezoid') {
      const a = v1, b = v2, h = v3;
      const area = ((a + b) / 2) * h;
      return [
        { label: 'Area (A = (a + b)/2 · h)', value: formatNum(area) },
        { label: 'Median Line Length ((a + b)/2)', value: formatNum((a + b) / 2) },
      ];
    } else {
      // Regular Polygon (n sides of length s)
      const s = v1, n = Math.max(3, Math.round(v2));
      const perim = n * s;
      const apothem = s / (2 * Math.tan(Math.PI / n));
      const area = 0.5 * perim * apothem;
      return [
        { label: `Perimeter (${n} sides)`, value: formatNum(perim) },
        { label: 'Apothem (r)', value: formatNum(apothem) },
        { label: 'Area (A = 0.5·P·r)', value: formatNum(area) },
      ];
    }
  };

  // Solve 3D Shapes
  const solve3D = () => {
    const v1 = parseFloat(val3D1) || 0;
    const v2 = parseFloat(val3D2) || 0;
    const v3 = parseFloat(val3D3) || 0;

    if (shape3D === 'sphere') {
      const r = v1;
      const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
      const surface = 4 * Math.PI * r * r;
      return [
        { label: 'Volume (V = 4/3·πr³)', value: formatNum(vol) },
        { label: 'Surface Area (A = 4πr²)', value: formatNum(surface) },
      ];
    } else if (shape3D === 'cylinder') {
      const r = v1, h = v2;
      const vol = Math.PI * r * r * h;
      const latArea = 2 * Math.PI * r * h;
      const totArea = latArea + 2 * Math.PI * r * r;
      return [
        { label: 'Volume (V = πr²h)', value: formatNum(vol) },
        { label: 'Lateral Area (2πrh)', value: formatNum(latArea) },
        { label: 'Total Surface Area (2πrh + 2πr²)', value: formatNum(totArea) },
      ];
    } else if (shape3D === 'cone') {
      const r = v1, h = v2;
      const slant = Math.sqrt(r * r + h * h);
      const vol = (1 / 3) * Math.PI * r * r * h;
      const latArea = Math.PI * r * slant;
      const totArea = latArea + Math.PI * r * r;
      return [
        { label: 'Volume (V = 1/3·πr²h)', value: formatNum(vol) },
        { label: 'Slant Height (s = √(r² + h²))', value: formatNum(slant) },
        { label: 'Total Surface Area (πrs + πr²)', value: formatNum(totArea) },
      ];
    } else if (shape3D === 'prism') {
      const l = v1, w = v2, h = v3;
      const vol = l * w * h;
      const surf = 2 * (l * w + l * h + w * h);
      const diag = Math.sqrt(l * l + w * w + h * h);
      return [
        { label: 'Volume (V = l·w·h)', value: formatNum(vol) },
        { label: 'Surface Area (2(lw + lh + wh))', value: formatNum(surf) },
        { label: 'Space Diagonal (√(l² + w² + h²))', value: formatNum(diag) },
      ];
    } else {
      // Pyramid (Square base side s, height h)
      const s = v1, h = v2;
      const vol = (1 / 3) * s * s * h;
      const slant = Math.sqrt(Math.pow(s / 2, 2) + h * h);
      const latArea = 2 * s * slant;
      const totArea = s * s + latArea;
      return [
        { label: 'Volume (V = 1/3·s²h)', value: formatNum(vol) },
        { label: 'Slant Height (s_h)', value: formatNum(slant) },
        { label: 'Total Surface Area (s² + 2s·s_h)', value: formatNum(totArea) },
      ];
    }
  };

  const triData = solveTriangle();
  const res2D = solve2D();
  const res3D = solve3D();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'triangle', label: 'Triangle & Trigonometry Solver' },
          { id: '2d_shapes', label: '2D Shapes (Area & Perimeter)' },
          { id: '3d_shapes', label: '3D Solid Shapes (Volume & Surface)' },
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

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* TRIANGLE SOLVER */}
        {tab === 'triangle' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Triangle Geometry Solver</h3>
                <p className="text-xs text-slate-400">Computes all angles, area, inradius, circumradius, and renders dynamic geometric diagram</p>
              </div>
              <button
                onClick={() => { setSideA('5'); setSideB('6'); setSideC('7'); }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Example (5, 6, 7)
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Side a</label>
                <input
                  type="number"
                  value={sideA}
                  onChange={(e) => setSideA(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Side b</label>
                <input
                  type="number"
                  value={sideB}
                  onChange={(e) => setSideB(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Side c</label>
                <input
                  type="number"
                  value={sideC}
                  onChange={(e) => setSideC(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>
            </div>

            {triData && (
              <div className="flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                {triData.error ? (
                  <div className="text-rose-400 text-sm font-semibold">{triData.error}</div>
                ) : (
                  <>
                    {/* SVG Graphic & Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-center relative min-h-[190px]">
                        <svg className="w-full h-44 overflow-visible" viewBox="0 0 260 170">
                          {/* Triangle polygon */}
                          <polygon
                            points={triData.svgPoints}
                            className="fill-sky-500/20 stroke-sky-400 stroke-2"
                          />
                          {/* Vertex Points */}
                          <circle cx={triData.pA?.x} cy={triData.pA?.y} r="4" className="fill-emerald-400" />
                          <circle cx={triData.pB?.x} cy={triData.pB?.y} r="4" className="fill-emerald-400" />
                          <circle cx={triData.pC?.x} cy={triData.pC?.y} r="4" className="fill-emerald-400" />

                          {/* Vertex Labels */}
                          <text x={(triData.pA?.x || 0) - 12} y={(triData.pA?.y || 0) + 14} className="fill-slate-300 text-[10px] font-bold">A (α: {triData.alphaDeg})</text>
                          <text x={(triData.pB?.x || 0) + 4} y={(triData.pB?.y || 0) + 14} className="fill-slate-300 text-[10px] font-bold">B (β: {triData.betaDeg})</text>
                          <text x={(triData.pC?.x || 0) - 15} y={(triData.pC?.y || 0) - 10} className="fill-slate-300 text-[10px] font-bold">C (γ: {triData.gammaDeg})</text>
                        </svg>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Total Area (A)</span>
                          <span className="text-lg font-mono font-bold text-emerald-400">{triData.area}</span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Perimeter (P)</span>
                          <span className="text-lg font-mono font-bold text-sky-400">{triData.perimeter}</span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Inradius (r)</span>
                          <span className="text-lg font-mono font-bold text-slate-200">{triData.inradius}</span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Circumradius (R)</span>
                          <span className="text-lg font-mono font-bold text-slate-200">{triData.circumradius}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2D SHAPES */}
        {tab === '2d_shapes' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">2D Geometric Shapes</h3>
                <p className="text-xs text-slate-400">Area, perimeter, and arc measurements</p>
              </div>
              <select
                value={shape2D}
                onChange={(e) => setShape2D(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-200"
              >
                <option value="circle">Circle (Radius)</option>
                <option value="sector">Circle Sector (Radius & Angle)</option>
                <option value="ellipse">Ellipse (Semi-major & Minor axes)</option>
                <option value="trapezoid">Trapezoid (Bases & Height)</option>
                <option value="polygon">Regular Polygon (Side & n)</option>
              </select>
            </div>

            {/* Inputs based on shape */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {shape2D === 'circle' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                  <input type="number" value={val2D1} onChange={(e) => setVal2D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                </div>
              )}

              {shape2D === 'sector' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                    <input type="number" value={val2D1} onChange={(e) => setVal2D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Central Angle (°)</label>
                    <input type="number" value={val2D2} onChange={(e) => setVal2D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}

              {shape2D === 'ellipse' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Semi-Major Axis (a)</label>
                    <input type="number" value={val2D1} onChange={(e) => setVal2D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Semi-Minor Axis (b)</label>
                    <input type="number" value={val2D2} onChange={(e) => setVal2D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}

              {shape2D === 'trapezoid' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Base a</label>
                    <input type="number" value={val2D1} onChange={(e) => setVal2D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Base b</label>
                    <input type="number" value={val2D2} onChange={(e) => setVal2D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Height h</label>
                    <input type="number" value={val2D3} onChange={(e) => setVal2D3(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}

              {shape2D === 'polygon' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Side Length (s)</label>
                    <input type="number" value={val2D1} onChange={(e) => setVal2D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Number of Sides (n)</label>
                    <input type="number" min="3" value={val2D2} onChange={(e) => setVal2D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              {res2D.map((r, i) => (
                <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">{r.label}</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3D SHAPES */}
        {tab === '3d_shapes' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">3D Solid Geometries</h3>
                <p className="text-xs text-slate-400">Volume and surface area computations</p>
              </div>
              <select
                value={shape3D}
                onChange={(e) => setShape3D(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-200"
              >
                <option value="cylinder">Cylinder (Radius & Height)</option>
                <option value="sphere">Sphere (Radius)</option>
                <option value="cone">Cone (Radius & Height)</option>
                <option value="prism">Rectangular Prism (l, w, h)</option>
                <option value="pyramid">Square Pyramid (Base s & Height)</option>
              </select>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {shape3D === 'sphere' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                  <input type="number" value={val3D1} onChange={(e) => setVal3D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                </div>
              )}

              {(shape3D === 'cylinder' || shape3D === 'cone') && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                    <input type="number" value={val3D1} onChange={(e) => setVal3D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Height (h)</label>
                    <input type="number" value={val3D2} onChange={(e) => setVal3D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}

              {shape3D === 'prism' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Length (l)</label>
                    <input type="number" value={val3D1} onChange={(e) => setVal3D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Width (w)</label>
                    <input type="number" value={val3D2} onChange={(e) => setVal3D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Height (h)</label>
                    <input type="number" value={val3D3} onChange={(e) => setVal3D3(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}

              {shape3D === 'pyramid' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Base Side (s)</label>
                    <input type="number" value={val3D1} onChange={(e) => setVal3D1(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">Pyramid Height (h)</label>
                    <input type="number" value={val3D2} onChange={(e) => setVal3D2(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100" />
                  </div>
                </>
              )}
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              {res3D.map((r, i) => (
                <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">{r.label}</span>
                  <span className="text-xl font-mono font-bold text-sky-400">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
