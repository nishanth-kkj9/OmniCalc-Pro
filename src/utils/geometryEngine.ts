/**
 * OmniCalc Pro Geometry & Coordinate Engine
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Line2DResult {
  distance: number;
  midpoint: Point2D;
  slope: number;
  intercept: number;
  equation: string;
  perpendicularSlope: number;
  angleDeg: number;
}

export interface Vector2DResult {
  magnitudeU: number;
  magnitudeV: number;
  dotProduct: number;
  angleRad: number;
  angleDeg: number;
  projectionUonV: Point2D;
}

export interface Vector3DResult {
  magnitudeU: number;
  magnitudeV: number;
  dotProduct: number;
  crossProduct: Point3D;
  angleRad: number;
  angleDeg: number;
}

/**
 * 2D Coordinate Line between two points P1 and P2
 */
export function analyze2DLine(p1: Point2D, p2: Point2D): Line2DResult {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const midpoint: Point2D = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };

  const slope = dx !== 0 ? dy / dx : Infinity;
  const intercept = isFinite(slope) ? p1.y - slope * p1.x : NaN;
  const perpendicularSlope = isFinite(slope) && slope !== 0 ? -1 / slope : slope === 0 ? Infinity : 0;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  let equation = '';
  if (!isFinite(slope)) {
    equation = `x = ${p1.x}`;
  } else if (slope === 0) {
    equation = `y = ${intercept.toFixed(4)}`;
  } else {
    const sign = intercept >= 0 ? '+' : '-';
    equation = `y = ${slope.toFixed(4)}x ${sign} ${Math.abs(intercept).toFixed(4)}`;
  }

  return {
    distance,
    midpoint,
    slope,
    intercept,
    equation,
    perpendicularSlope,
    angleDeg,
  };
}

/**
 * 2D Vector Operations
 */
export function analyze2DVectors(u: Point2D, v: Point2D): Vector2DResult {
  const magU = Math.sqrt(u.x * u.x + u.y * u.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  const dot = u.x * v.x + u.y * v.y;

  let cosTheta = 0;
  if (magU > 0 && magV > 0) {
    cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
  }
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  const projScalar = magV > 0 ? dot / (magV * magV) : 0;
  const projectionUonV: Point2D = {
    x: projScalar * v.x,
    y: projScalar * v.y,
  };

  return {
    magnitudeU: magU,
    magnitudeV: magV,
    dotProduct: dot,
    angleRad,
    angleDeg,
    projectionUonV,
  };
}

/**
 * 3D Vector Operations
 */
export function analyze3DVectors(u: Point3D, v: Point3D): Vector3DResult {
  const magU = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const dot = u.x * v.x + u.y * v.y + u.z * v.z;

  const cross: Point3D = {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };

  let cosTheta = 0;
  if (magU > 0 && magV > 0) {
    cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
  }
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return {
    magnitudeU: magU,
    magnitudeV: magV,
    dotProduct: dot,
    crossProduct: cross,
    angleRad,
    angleDeg,
  };
}
