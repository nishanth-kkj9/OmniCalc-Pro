"""
OmniCalc Pro Geometry & Vector Engine (Python Desktop Parity)
Supports Triangle Solving (SSS, SAS, ASA, AAS, SSA ambiguous case),
2D Shapes (Circle, Sector, Ellipse, Trapezoid, Polygon),
3D Solids (Sphere, Cylinder, Cone, Prism, Pyramid),
2D Coordinate Lines, and 2D/3D Vector Analysis.
"""

import math
from typing import List, Dict, Any, Tuple, Optional


class GeometryEngine:
    @staticmethod
    def solve_triangle_sss(a: float, b: float, c: float) -> Dict[str, Any]:
        if a <= 0 or b <= 0 or c <= 0:
            raise ValueError("All side lengths must be positive.")
        if a + b <= c or a + c <= b or b + c <= a:
            raise ValueError("Triangle Inequality Violation: The sum of any two sides must exceed the third side.")

        # Law of Cosines
        cos_A = max(-1.0, min(1.0, (b**2 + c**2 - a**2) / (2.0 * b * c)))
        cos_B = max(-1.0, min(1.0, (a**2 + c**2 - b**2) / (2.0 * a * c)))
        cos_C = max(-1.0, min(1.0, (a**2 + b**2 - c**2) / (2.0 * a * b)))

        rad_A, rad_B, rad_C = math.acos(cos_A), math.acos(cos_B), math.acos(cos_C)
        deg_A, deg_B, deg_C = math.degrees(rad_A), math.degrees(rad_B), math.degrees(rad_C)

        perimeter = a + b + c
        s = perimeter / 2.0
        area = math.sqrt(max(0.0, s * (s - a) * (s - b) * (s - c)))
        inradius = area / s if s > 0 else 0.0
        circumradius = (a * b * c) / (4.0 * area) if area > 0 else 0.0

        return {
            "a": a, "b": b, "c": c,
            "angle_A_deg": deg_A, "angle_B_deg": deg_B, "angle_C_deg": deg_C,
            "perimeter": perimeter, "semi_perimeter": s, "area": area,
            "inradius": inradius, "circumradius": circumradius
        }

    @staticmethod
    def solve_triangle_ssa(a: float, b: float, deg_A: float) -> Dict[str, Any]:
        """
        Solves a triangle given Side a, Side b, and Angle A (SSA).
        Handles the AMBIGUOUS CASE carefully when a < b and a > b*sin(A).
        Returns a dictionary containing 'solutions': list of valid triangle results.
        """
        if a <= 0 or b <= 0 or deg_A <= 0 or deg_A >= 180:
            raise ValueError("Sides must be positive and Angle A must be between 0° and 180°.")

        rad_A = math.radians(deg_A)
        h = b * math.sin(rad_A)

        solutions = []

        if a < h - 1e-9:
            # 0 solutions
            return {
                "num_solutions": 0,
                "solutions": [],
                "message": f"No triangle exists because a ({a:g}) < h ({h:g})."
            }
        elif abs(a - h) < 1e-9:
            # 1 right triangle solution
            rad_B = math.pi / 2.0
            deg_B = 90.0
            deg_C = 180.0 - deg_A - deg_B
            rad_C = math.radians(deg_C)
            c = b * math.cos(rad_A)
            sol = GeometryEngine.solve_triangle_sss(a, b, c)
            solutions.append(sol)
        elif a >= b:
            # 1 unique solution
            sin_B = (b * math.sin(rad_A)) / a
            rad_B = math.asin(max(-1.0, min(1.0, sin_B)))
            deg_B = math.degrees(rad_B)
            deg_C = 180.0 - deg_A - deg_B
            rad_C = math.radians(deg_C)
            c = (a * math.sin(rad_C)) / math.sin(rad_A)
            sol = GeometryEngine.solve_triangle_sss(a, b, c)
            solutions.append(sol)
        else:
            # Ambiguous Case: 2 valid solutions!
            sin_B = (b * math.sin(rad_A)) / a
            rad_B1 = math.asin(max(-1.0, min(1.0, sin_B)))
            deg_B1 = math.degrees(rad_B1)
            deg_C1 = 180.0 - deg_A - deg_B1
            rad_C1 = math.radians(deg_C1)
            c1 = (a * math.sin(rad_C1)) / math.sin(rad_A)
            sol1 = GeometryEngine.solve_triangle_sss(a, b, c1)
            solutions.append(sol1)

            # Solution 2 (Obtuse angle B)
            deg_B2 = 180.0 - deg_B1
            deg_C2 = 180.0 - deg_A - deg_B2
            if deg_C2 > 0:
                rad_C2 = math.radians(deg_C2)
                c2 = (a * math.sin(rad_C2)) / math.sin(rad_A)
                sol2 = GeometryEngine.solve_triangle_sss(a, b, c2)
                solutions.append(sol2)

        return {
            "num_solutions": len(solutions),
            "solutions": solutions,
            "message": f"Ambiguous SSA Case yielded {len(solutions)} valid triangle(s)."
        }

    @staticmethod
    def solve_2d_shape(shape_type: str, p1: float, p2: float = 0.0, p3: float = 0.0) -> Dict[str, Any]:
        if shape_type == "circle":
            r = p1
            area = math.pi * r * r
            perimeter = 2.0 * math.pi * r
            return {"shape": "Circle", "radius": r, "area": area, "perimeter": perimeter}
        elif shape_type == "sector":
            r, deg = p1, p2
            rad = math.radians(deg)
            area = 0.5 * r * r * rad
            arc_length = r * rad
            perimeter = arc_length + 2.0 * r
            return {"shape": "Circular Sector", "radius": r, "angle_deg": deg, "area": area, "arc_length": arc_length, "perimeter": perimeter}
        elif shape_type == "ellipse":
            a, b = p1, p2
            area = math.pi * a * b
            # Ramanujan approximation for ellipse perimeter
            h = ((a - b) ** 2) / ((a + b) ** 2) if (a + b) > 0 else 0
            perimeter = math.pi * (a + b) * (1.0 + (3.0 * h) / (10.0 + math.sqrt(4.0 - 3.0 * h)))
            return {"shape": "Ellipse", "semi_major_a": a, "semi_minor_b": b, "area": area, "approx_perimeter": perimeter}
        elif shape_type == "trapezoid":
            b1, b2, h = p1, p2, p3
            area = 0.5 * (b1 + b2) * h
            return {"shape": "Trapezoid", "base1": b1, "base2": b2, "height": h, "area": area}
        elif shape_type == "polygon":
            n_sides = int(p1)
            side_len = p2
            if n_sides < 3:
                raise ValueError("Regular polygon must have at least 3 sides.")
            perimeter = n_sides * side_len
            area = (n_sides * side_len ** 2) / (4.0 * math.tan(math.pi / n_sides))
            interior_angle = ((n_sides - 2) * 180.0) / n_sides
            return {"shape": "Regular Polygon", "n_sides": n_sides, "side_length": side_len, "area": area, "perimeter": perimeter, "interior_angle_deg": interior_angle}
        else:
            raise ValueError(f"Unknown 2D shape type: {shape_type}")

    @staticmethod
    def solve_3d_shape(shape_type: str, p1: float, p2: float = 0.0, p3: float = 0.0) -> Dict[str, Any]:
        if shape_type == "sphere":
            r = p1
            volume = (4.0 / 3.0) * math.pi * (r ** 3)
            surface_area = 4.0 * math.pi * (r ** 2)
            return {"shape": "Sphere", "radius": r, "volume": volume, "surface_area": surface_area}
        elif shape_type == "cylinder":
            r, h = p1, p2
            volume = math.pi * (r ** 2) * h
            surface_area = 2.0 * math.pi * r * h + 2.0 * math.pi * (r ** 2)
            return {"shape": "Cylinder", "radius": r, "height": h, "volume": volume, "surface_area": surface_area}
        elif shape_type == "cone":
            r, h = p1, p2
            slant_l = math.sqrt(r ** 2 + h ** 2)
            volume = (1.0 / 3.0) * math.pi * (r ** 2) * h
            surface_area = math.pi * r * slant_l + math.pi * (r ** 2)
            return {"shape": "Cone", "radius": r, "height": h, "slant_height": slant_l, "volume": volume, "surface_area": surface_area}
        elif shape_type == "prism":
            l, w, h = p1, p2, p3
            volume = l * w * h
            surface_area = 2.0 * (l * w + l * h + w * h)
            return {"shape": "Rectangular Prism", "length": l, "width": w, "height": h, "volume": volume, "surface_area": surface_area}
        elif shape_type == "pyramid":
            l, w, h = p1, p2, p3
            volume = (1.0 / 3.0) * l * w * h
            base_area = l * w
            slant1 = math.sqrt((w / 2.0) ** 2 + h ** 2)
            slant2 = math.sqrt((l / 2.0) ** 2 + h ** 2)
            surface_area = base_area + l * slant1 + w * slant2
            return {"shape": "Rectangular Pyramid", "length": l, "width": w, "height": h, "volume": volume, "surface_area": surface_area}
        else:
            raise ValueError(f"Unknown 3D shape type: {shape_type}")

    @staticmethod
    def analyze_2d_line(x1: float, y1: float, x2: float, y2: float) -> Dict[str, Any]:
        dx = x2 - x1
        dy = y2 - y1
        dist = math.sqrt(dx * dx + dy * dy)
        midpoint = ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

        slope = dy / dx if dx != 0 else float("inf")
        intercept = (y1 - slope * x1) if math.isfinite(slope) else None
        perp_slope = (-1.0 / slope) if (math.isfinite(slope) and slope != 0) else (0.0 if not math.isfinite(slope) else float("inf"))
        angle_deg = math.degrees(math.atan2(dy, dx))

        if not math.isfinite(slope):
            eq = f"x = {x1:g}"
        elif slope == 0:
            eq = f"y = {intercept:g}"
        else:
            sign = "+" if intercept >= 0 else "-"
            eq = f"y = {slope:.4g}x {sign} {abs(intercept):.4g}"

        return {
            "p1": (x1, y1), "p2": (x2, y2),
            "distance": dist, "midpoint": midpoint,
            "slope": slope, "intercept": intercept,
            "perpendicular_slope": perp_slope,
            "angle_deg": angle_deg, "equation": eq
        }

    @staticmethod
    def analyze_vectors_2d(ux: float, uy: float, vx: float, vy: float) -> Dict[str, Any]:
        mag_u = math.sqrt(ux * ux + uy * uy)
        mag_v = math.sqrt(vx * vx + vy * vy)
        dot = ux * vx + uy * vy

        cos_theta = max(-1.0, min(1.0, dot / (mag_u * mag_v))) if (mag_u > 0 and mag_v > 0) else 0.0
        angle_rad = math.acos(cos_theta)
        angle_deg = math.degrees(angle_rad)

        proj_scalar = (dot / (mag_v * mag_v)) if mag_v > 0 else 0.0
        proj_u_on_v = (proj_scalar * vx, proj_scalar * vy)

        return {
            "u": (ux, uy), "v": (vx, vy),
            "magnitude_u": mag_u, "magnitude_v": mag_v,
            "dot_product": dot,
            "angle_rad": angle_rad, "angle_deg": angle_deg,
            "projection_u_on_v": proj_u_on_v
        }

    @staticmethod
    def analyze_vectors_3d(ux: float, uy: float, uz: float, vx: float, vy: float, vz: float) -> Dict[str, Any]:
        mag_u = math.sqrt(ux * ux + uy * uy + uz * uz)
        mag_v = math.sqrt(vx * vx + vy * vy + vz * vz)
        dot = ux * vx + uy * vy + uz * vz

        cross = (
            uy * vz - uz * vy,
            uz * vx - ux * vz,
            ux * vy - uy * vx
        )

        cos_theta = max(-1.0, min(1.0, dot / (mag_u * mag_v))) if (mag_u > 0 and mag_v > 0) else 0.0
        angle_rad = math.acos(cos_theta)
        angle_deg = math.degrees(angle_rad)

        return {
            "u": (ux, uy, uz), "v": (vx, vy, vz),
            "magnitude_u": mag_u, "magnitude_v": mag_v,
            "dot_product": dot, "cross_product": cross,
            "angle_rad": angle_rad, "angle_deg": angle_deg
        }
