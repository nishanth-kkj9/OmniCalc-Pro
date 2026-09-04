import React, { useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { AppSettings } from '../types';
import { handleTablistKeydown } from '../utils/ariaTabs';
import { analyze2DLine, analyze3DVectors } from '../utils/geometryEngine';

interface GeometryCalculatorProps {
  settings: AppSettings;
  onNavigateToGraph?: (expression?: string) => void;
}

export const GeometryCalculator: React.FC<GeometryCalculatorProps> = ({ settings, onNavigateToGraph }) => {
  const [tab, setTab] = useState<'triangle' | '2d_shapes' | '3d_shapes' | 'coordinate'>('triangle');

  // Triangle State (Sides a, b, c)
  const [sideA, setSideA] = useState<string>('5');
  const [sideB, setSideB] = useState<string>('6');
  const [sideC, setSideC] = useState<string>('7');

  // 2D Shapes State
  const [shape2D, setShape2D] = useState<'circle' | 'sector' | 'ellipse' | 'trapezoid' | 'polygon'>(
    'circle'
  );
  const [val2D1, setVal2D1] = useState<string>('5'); // radius / a / base1
  const [val2D2, setVal2D2] = useState<string>('8'); // angle / b / base2
  const [val2D3, setVal2D3] = useState<string>('4'); // height / sides

  // 3D Shapes State
  const [shape3D, setShape3D] = useState<'sphere' | 'cylinder' | 'cone' | 'prism' | 'pyramid'>(
    'cylinder'
  );
  const [val3D1, setVal3D1] = useState<string>('4'); // radius / length
  const [val3D2, setVal3D2] = useState<string>('10'); // height / width
  const [val3D3, setVal3D3] = useState<string>('6'); // height for prism

  // Coordinate & Vectors State
  const [p1x, setP1x] = useState<string>('1');
  const [p1y, setP1y] = useState<string>('2');
  const [p2x, setP2x] = useState<string>('5');
  const [p2y, setP2y] = useState<string>('8');

  const [u3x, setU3x] = useState<string>('2');
  const [u3y, setU3y] = useState<string>('3');
  const [u3z, setU3z] = useState<string>('-1');
  const [v3x, setV3x] = useState<string>('4');
  const [v3y, setV3y] = useState<string>('0');
  const [v3z, setV3z] = useState<string>('5');

  const GEOMETRY_TABS = ['triangle', '2d_shapes', '3d_shapes', 'coordinate'] as const;
  const SHAPES_2D = ['circle', 'sector', 'ellipse', 'trapezoid', 'polygon'] as const;
  const SHAPES_3D = ['sphere', 'cylinder', 'cone', 'prism', 'pyramid'] as const;

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
      return {
        error:
          'Invalid triangle: the sum of any two sides must be strictly greater than the third side.',
      };
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
      const a = v1,
        b = v2;
      const area = Math.PI * a * b;
      // Ramanujan approx for circumference
      const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
      const circ = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      return [
        { label: 'Area (A = πab)', value: formatNum(area) },
        { label: 'Circumference (Ramanujan approx)', value: formatNum(circ) },
        {
          label: 'Eccentricity (e = √(1 - b²/a²))',
          value: a >= b ? formatNum(Math.sqrt(1 - (b * b) / (a * a))) : 'N/A',
        },
      ];
    } else if (shape2D === 'trapezoid') {
      const a = v1,
        b = v2,
        h = v3;
      const area = ((a + b) / 2) * h;
      return [
        { label: 'Area (A = (a + b)/2 · h)', value: formatNum(area) },
        { label: 'Median Line Length ((a + b)/2)', value: formatNum((a + b) / 2) },
      ];
    } else {
      // Regular Polygon (n sides of length s)
      const s = v1,
        n = Math.max(3, Math.round(v2));
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
      const r = v1,
        h = v2;
      const vol = Math.PI * r * r * h;
      const latArea = 2 * Math.PI * r * h;
      const totArea = latArea + 2 * Math.PI * r * r;
      return [
        { label: 'Volume (V = πr²h)', value: formatNum(vol) },
        { label: 'Lateral Area (2πrh)', value: formatNum(latArea) },
        { label: 'Total Surface Area (2πrh + 2πr²)', value: formatNum(totArea) },
      ];
    } else if (shape3D === 'cone') {
      const r = v1,
        h = v2;
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
      const l = v1,
        w = v2,
        h = v3;
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
      const s = v1,
        h = v2;
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
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        role="tablist"
        aria-label="Geometry calculator modes"
        onKeyDown={(e) => handleTablistKeydown(e, [...GEOMETRY_TABS], tab, setTab as (tab: string) => void)}
      >
        {[
          { id: 'triangle', label: 'Triangle & Trigonometry Solver' },
          { id: '2d_shapes', label: '2D Shapes (Area & Perimeter)' },
          { id: '3d_shapes', label: '3D Solid Shapes (Volume & Surface)' },
          { id: 'coordinate', label: 'Coordinate & Vectors' },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`geo-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`geo-panel-${item.id}`}
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
        {/* TRIANGLE SOLVER */}
        <div role="tabpanel" id="geo-panel-triangle" aria-labelledby="geo-tab-triangle" hidden={tab !== 'triangle'} className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100">Triangle Geometry Solver</h3>
                <p className="text-xs text-slate-400">
                  Computes all angles, area, inradius, circumradius, and renders dynamic geometric
                  diagram
                </p>
              </div>
              <button
                onClick={() => {
                  setSideA('5');
                  setSideB('6');
                  setSideC('7');
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 flex-shrink-0"
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
                  <div role="alert" className="text-rose-400 text-sm font-semibold">{triData.error}</div>
                ) : (
                  <>
                    {/* SVG Graphic & Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-center relative min-h-[190px]">
                        <svg className="w-full h-44 overflow-visible" viewBox="0 0 260 170" role="img" aria-label="Geometric triangle diagram">
                          {/* Triangle polygon */}
                          <polygon
                            points={triData.svgPoints}
                            className="fill-sky-500/20 stroke-sky-400 stroke-2"
                          />
                          {/* Vertex Points */}
                          <circle
                            cx={triData.pA?.x}
                            cy={triData.pA?.y}
                            r="4"
                            className="fill-emerald-400"
                          />
                          <circle
                            cx={triData.pB?.x}
                            cy={triData.pB?.y}
                            r="4"
                            className="fill-emerald-400"
                          />
                          <circle
                            cx={triData.pC?.x}
                            cy={triData.pC?.y}
                            r="4"
                            className="fill-emerald-400"
                          />

                          {/* Vertex Labels */}
                          <text
                            x={(triData.pA?.x || 0) - 12}
                            y={(triData.pA?.y || 0) + 14}
                            className="fill-slate-300 text-[10px] font-bold"
                          >
                            A (α: {triData.alphaDeg})
                          </text>
                          <text
                            x={(triData.pB?.x || 0) + 4}
                            y={(triData.pB?.y || 0) + 14}
                            className="fill-slate-300 text-[10px] font-bold"
                          >
                            B (β: {triData.betaDeg})
                          </text>
                          <text
                            x={(triData.pC?.x || 0) - 15}
                            y={(triData.pC?.y || 0) - 10}
                            className="fill-slate-300 text-[10px] font-bold"
                          >
                            C (γ: {triData.gammaDeg})
                          </text>
                        </svg>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Total Area (A)</span>
                          <span className="text-lg font-mono font-bold text-emerald-400">
                            {triData.area}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Perimeter (P)</span>
                          <span className="text-lg font-mono font-bold text-sky-400">
                            {triData.perimeter}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Inradius (r)</span>
                          <span className="text-lg font-mono font-bold text-slate-200">
                            {triData.inradius}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Circumradius (R)</span>
                          <span className="text-lg font-mono font-bold text-slate-200">
                            {triData.circumradius}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        {/* 2D SHAPES */}
        <div role="tabpanel" id="geo-panel-2d_shapes" aria-labelledby="geo-tab-2d_shapes" hidden={tab !== '2d_shapes'} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">2D Geometric Shapes</h3>
                <p className="text-xs text-slate-400">Area, perimeter, and arc measurements</p>
              </div>
              <div
                className="flex items-center gap-2 overflow-x-auto"
                role="tablist"
                aria-label="2D shape selector"
                onKeyDown={(e) => handleTablistKeydown(e, [...SHAPES_2D], shape2D, setShape2D as (tab: string) => void)}
              >
                {[
                  { id: 'circle', label: 'Circle (Radius)' },
                  { id: 'sector', label: 'Circle Sector (Radius & Angle)' },
                  { id: 'ellipse', label: 'Ellipse (Semi-major & Minor axes)' },
                  { id: 'trapezoid', label: 'Trapezoid (Bases & Height)' },
                  { id: 'polygon', label: 'Regular Polygon (Side & n)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    id={`geo2d-tab-${item.id}`}
                    aria-selected={shape2D === item.id}
                    aria-controls={`geo2d-panel-${item.id}`}
                    tabIndex={shape2D === item.id ? 0 : -1}
                    onClick={() => setShape2D(item.id as any)}
                    className={`bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-200 ${shape2D === item.id ? 'bg-sky-600 text-white border-sky-500' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs based on shape */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div role="tabpanel" id="geo2d-panel-circle" aria-labelledby="geo2d-tab-circle" hidden={shape2D !== 'circle'} className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                <input
                  type="number"
                  value={val2D1}
                  onChange={(e) => setVal2D1(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>

              <div role="tabpanel" id="geo2d-panel-sector" aria-labelledby="geo2d-tab-sector" hidden={shape2D !== 'sector'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                  <input
                    type="number"
                    value={val2D1}
                    onChange={(e) => setVal2D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Central Angle (°)</label>
                  <input
                    type="number"
                    value={val2D2}
                    onChange={(e) => setVal2D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo2d-panel-ellipse" aria-labelledby="geo2d-tab-ellipse" hidden={shape2D !== 'ellipse'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Semi-Major Axis (a)</label>
                  <input
                    type="number"
                    value={val2D1}
                    onChange={(e) => setVal2D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Semi-Minor Axis (b)</label>
                  <input
                    type="number"
                    value={val2D2}
                    onChange={(e) => setVal2D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo2d-panel-trapezoid" aria-labelledby="geo2d-tab-trapezoid" hidden={shape2D !== 'trapezoid'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Base a</label>
                  <input
                    type="number"
                    value={val2D1}
                    onChange={(e) => setVal2D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Base b</label>
                  <input
                    type="number"
                    value={val2D2}
                    onChange={(e) => setVal2D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Height h</label>
                  <input
                    type="number"
                    value={val2D3}
                    onChange={(e) => setVal2D3(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo2d-panel-polygon" aria-labelledby="geo2d-tab-polygon" hidden={shape2D !== 'polygon'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Side Length (s)</label>
                  <input
                    type="number"
                    value={val2D1}
                    onChange={(e) => setVal2D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Number of Sides (n)</label>
                  <input
                    type="number"
                    min="3"
                    value={val2D2}
                    onChange={(e) => setVal2D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>
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

        {/* 3D SHAPES */}
        <div role="tabpanel" id="geo-panel-3d_shapes" aria-labelledby="geo-tab-3d_shapes" hidden={tab !== '3d_shapes'} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">3D Solid Geometries</h3>
                <p className="text-xs text-slate-400">Volume and surface area computations</p>
              </div>
              <div
                className="flex items-center gap-2 overflow-x-auto"
                role="tablist"
                aria-label="3D shape selector"
                onKeyDown={(e) => handleTablistKeydown(e, [...SHAPES_3D], shape3D, setShape3D as (tab: string) => void)}
              >
                {[
                  { id: 'sphere', label: 'Sphere (Radius)' },
                  { id: 'cylinder', label: 'Cylinder (Radius & Height)' },
                  { id: 'cone', label: 'Cone (Radius & Height)' },
                  { id: 'prism', label: 'Rectangular Prism (l, w, h)' },
                  { id: 'pyramid', label: 'Square Pyramid (Base s & Height)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    id={`geo3d-tab-${item.id}`}
                    aria-selected={shape3D === item.id}
                    aria-controls={`geo3d-panel-${item.id}`}
                    tabIndex={shape3D === item.id ? 0 : -1}
                    onClick={() => setShape3D(item.id as any)}
                    className={`bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-200 ${shape3D === item.id ? 'bg-sky-600 text-white border-sky-500' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div role="tabpanel" id="geo3d-panel-sphere" aria-labelledby="geo3d-tab-sphere" hidden={shape3D !== 'sphere'} className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                <input
                  type="number"
                  value={val3D1}
                  onChange={(e) => setVal3D1(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                />
              </div>

              <div role="tabpanel" id="geo3d-panel-cylinder" aria-labelledby="geo3d-tab-cylinder" hidden={shape3D !== 'cylinder'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                  <input
                    type="number"
                    value={val3D1}
                    onChange={(e) => setVal3D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Height (h)</label>
                  <input
                    type="number"
                    value={val3D2}
                    onChange={(e) => setVal3D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo3d-panel-cone" aria-labelledby="geo3d-tab-cone" hidden={shape3D !== 'cone'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Radius (r)</label>
                  <input
                    type="number"
                    value={val3D1}
                    onChange={(e) => setVal3D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Height (h)</label>
                  <input
                    type="number"
                    value={val3D2}
                    onChange={(e) => setVal3D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo3d-panel-prism" aria-labelledby="geo3d-tab-prism" hidden={shape3D !== 'prism'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Length (l)</label>
                  <input
                    type="number"
                    value={val3D1}
                    onChange={(e) => setVal3D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Width (w)</label>
                  <input
                    type="number"
                    value={val3D2}
                    onChange={(e) => setVal3D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Height (h)</label>
                  <input
                    type="number"
                    value={val3D3}
                    onChange={(e) => setVal3D3(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>

              <div role="tabpanel" id="geo3d-panel-pyramid" aria-labelledby="geo3d-tab-pyramid" hidden={shape3D !== 'pyramid'} className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Base Side (s)</label>
                  <input
                    type="number"
                    value={val3D1}
                    onChange={(e) => setVal3D1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Pyramid Height (h)</label>
                  <input
                    type="number"
                    value={val3D2}
                    onChange={(e) => setVal3D2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-3 font-mono text-base font-bold text-slate-100"
                  />
                </div>
              </div>
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

        {/* COORDINATE & VECTORS */}
        <div role="tabpanel" id="geo-panel-coordinate" aria-labelledby="geo-tab-coordinate" hidden={tab !== 'coordinate'} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">2D Lines & 3D Vectors Analysis</h3>
              <p className="text-xs text-slate-400">
                Calculates distance, midpoint, slope, perpendicular bisector, dot/cross products, and angles
              </p>
            </div>
            {onNavigateToGraph && (
              <button
                onClick={() => onNavigateToGraph()}
                className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Open Graphing Calculator
              </button>
            )}
          </div>

          {/* 2D Line Section */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
            <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">2D Line Between Points P₁ and P₂</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">P₁ X</label>
                <input
                  type="number"
                  value={p1x}
                  onChange={(e) => setP1x(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">P₁ Y</label>
                <input
                  type="number"
                  value={p1y}
                  onChange={(e) => setP1y(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">P₂ X</label>
                <input
                  type="number"
                  value={p2x}
                  onChange={(e) => setP2x(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">P₂ Y</label>
                <input
                  type="number"
                  value={p2y}
                  onChange={(e) => setP2y(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-100"
                />
              </div>
            </div>

            {(() => {
              const p1 = { x: parseFloat(p1x) || 0, y: parseFloat(p1y) || 0 };
              const p2 = { x: parseFloat(p2x) || 0, y: parseFloat(p2y) || 0 };
              const lineRes = analyze2DLine(p1, p2);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Euclidean Distance</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{formatNum(lineRes.distance)}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Midpoint (x, y)</span>
                    <span className="font-mono text-sm font-bold text-sky-400">({formatNum(lineRes.midpoint.x)}, {formatNum(lineRes.midpoint.y)})</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Slope (m)</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{isFinite(lineRes.slope) ? formatNum(lineRes.slope) : 'Undefined (Vertical)'}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Line Equation</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">{lineRes.equation}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 3D Vector Operations */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">3D Vector Operations (u × v, u · v)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300">Vector u = (ux, uy, uz)</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={u3x}
                    onChange={(e) => setU3x(e.target.value)}
                    placeholder="ux"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                  <input
                    type="number"
                    value={u3y}
                    onChange={(e) => setU3y(e.target.value)}
                    placeholder="uy"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                  <input
                    type="number"
                    value={u3z}
                    onChange={(e) => setU3z(e.target.value)}
                    placeholder="uz"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300">Vector v = (vx, vy, vz)</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={v3x}
                    onChange={(e) => setV3x(e.target.value)}
                    placeholder="vx"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                  <input
                    type="number"
                    value={v3y}
                    onChange={(e) => setV3y(e.target.value)}
                    placeholder="vy"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                  <input
                    type="number"
                    value={v3z}
                    onChange={(e) => setV3z(e.target.value)}
                    placeholder="vz"
                    className="bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono text-sm font-bold text-slate-100"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const u = { x: parseFloat(u3x) || 0, y: parseFloat(u3y) || 0, z: parseFloat(u3z) || 0 };
              const v = { x: parseFloat(v3x) || 0, y: parseFloat(v3y) || 0, z: parseFloat(v3z) || 0 };
              const vRes = analyze3DVectors(u, v);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">|u|, |v|</span>
                    <span className="font-mono text-sm font-bold text-slate-200">{formatNum(vRes.magnitudeU)}, {formatNum(vRes.magnitudeV)}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Dot Product (u · v)</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{formatNum(vRes.dotProduct)}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Cross Product (u × v)</span>
                    <span className="font-mono text-sm font-bold text-sky-400">({formatNum(vRes.crossProduct.x)}, {formatNum(vRes.crossProduct.y)}, {formatNum(vRes.crossProduct.z)})</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Enclosed Angle</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{formatNum(vRes.angleDeg)}°</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
