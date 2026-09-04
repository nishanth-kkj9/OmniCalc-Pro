import { describe, it, expect } from 'vitest';
import {
  analyze2DLine,
  analyze2DVectors,
  analyze3DVectors,
} from './geometryEngine';

describe('Geometry Engine', () => {
  it('analyzes 2D line segment between (0,0) and (3,4)', () => {
    const res = analyze2DLine({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(res.distance).toBe(5);
    expect(res.midpoint).toEqual({ x: 1.5, y: 2 });
    expect(res.slope).toBeCloseTo(4 / 3, 5);
    expect(res.perpendicularSlope).toBeCloseTo(-3 / 4, 5);
    expect(res.angleDeg).toBeCloseTo(53.13, 2);
  });

  it('computes 2D vector dot product and projection', () => {
    const u = { x: 1, y: 2 };
    const v = { x: 3, y: 4 };
    const res = analyze2DVectors(u, v);
    expect(res.dotProduct).toBe(11);
    expect(res.magnitudeU).toBeCloseTo(Math.sqrt(5), 5);
    expect(res.magnitudeV).toBe(5);
    expect(res.projectionUonV.x).toBeCloseTo((11 / 25) * 3, 5);
    expect(res.projectionUonV.y).toBeCloseTo((11 / 25) * 4, 5);
  });

  it('computes 3D cross product and angle', () => {
    const u = { x: 1, y: 0, z: 0 };
    const v = { x: 0, y: 1, z: 0 };
    const res = analyze3DVectors(u, v);
    expect(res.dotProduct).toBe(0);
    expect(res.crossProduct).toEqual({ x: 0, y: 0, z: 1 });
    expect(res.angleDeg).toBeCloseTo(90, 5);
  });
});
