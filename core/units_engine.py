"""
OmniCalc Pro Physical Units & Dimensional Analysis Engine (Python Desktop Parity)
Supports:
- 7 SI Base Dimensions: [Mass, Length, Time, Electric Current, Temperature, Amount of Substance, Luminous Intensity]
- Compound units and dimensional vector algebra
- Unit conversions (SI, Imperial, Astronomical, Physical)
- Dimensional consistency validator (flags illegal operations)
- Automatic physical quantity identification (e.g. [M][L]^2[T]^-2 -> Energy / Work / Torque)
- Universal physical constants library
- Physics formula evaluation with unit awareness
"""

import math
from typing import List, Dict, Any, Tuple, Optional

# Dimension Vector: [M, L, T, I, Theta, N, J]
# 0: Mass (kg)
# 1: Length (m)
# 2: Time (s)
# 3: Current (A)
# 4: Temperature (K)
# 5: Substance (mol)
# 6: Luminosity (cd)

DIMENSIONLESS = [0, 0, 0, 0, 0, 0, 0]
MASS = [1, 0, 0, 0, 0, 0, 0]
LENGTH = [0, 1, 0, 0, 0, 0, 0]
TIME = [0, 0, 1, 0, 0, 0, 0]
CURRENT = [0, 0, 0, 1, 0, 0, 0]
TEMPERATURE = [0, 0, 0, 0, 1, 0, 0]
SUBSTANCE = [0, 0, 0, 0, 0, 1, 0]
LUMINOUS = [0, 0, 0, 0, 0, 0, 1]

AREA_DIM = [0, 2, 0, 0, 0, 0, 0]
VOLUME_DIM = [0, 3, 0, 0, 0, 0, 0]
VELOCITY_DIM = [0, 1, -1, 0, 0, 0, 0]
ACCELERATION_DIM = [0, 1, -2, 0, 0, 0, 0]
FORCE_DIM = [1, 1, -2, 0, 0, 0, 0]
ENERGY_DIM = [1, 2, -2, 0, 0, 0, 0]
POWER_DIM = [1, 2, -3, 0, 0, 0, 0]
PRESSURE_DIM = [1, -1, -2, 0, 0, 0, 0]
CHARGE_DIM = [0, 0, 1, 1, 0, 0, 0]
VOLTAGE_DIM = [1, 2, -3, -1, 0, 0, 0]
RESISTANCE_DIM = [1, 2, -3, -2, 0, 0, 0]
CAPACITANCE_DIM = [-1, -2, 4, 2, 0, 0, 0]
FREQUENCY_DIM = [0, 0, -1, 0, 0, 0, 0]
DENSITY_DIM = [1, -3, 0, 0, 0, 0, 0]


class UnitsEngine:
    @staticmethod
    def are_dimensions_equal(a: List[float], b: List[float]) -> bool:
        return all(abs(a[i] - b[i]) < 1e-6 for i in range(7))

    @staticmethod
    def format_dimension_vector(dim: List[float]) -> str:
        symbols = ['M', 'L', 'T', 'I', 'Θ', 'N', 'J']
        parts = []
        for idx, exp in enumerate(dim):
            if exp != 0:
                if exp == 1:
                    parts.append(f"[{symbols[idx]}]")
                else:
                    parts.append(f"[{symbols[idx]}]^{exp:g}")
        return "·".join(parts) if parts else "Dimensionless [1]"

    @staticmethod
    def identify_quantity_name(dim: List[float]) -> str:
        if UnitsEngine.are_dimensions_equal(dim, DIMENSIONLESS):
            return "Dimensionless (Ratio / Number)"
        if UnitsEngine.are_dimensions_equal(dim, LENGTH):
            return "Length / Distance"
        if UnitsEngine.are_dimensions_equal(dim, MASS):
            return "Mass"
        if UnitsEngine.are_dimensions_equal(dim, TIME):
            return "Time / Duration"
        if UnitsEngine.are_dimensions_equal(dim, CURRENT):
            return "Electric Current"
        if UnitsEngine.are_dimensions_equal(dim, TEMPERATURE):
            return "Thermodynamic Temperature"
        if UnitsEngine.are_dimensions_equal(dim, SUBSTANCE):
            return "Amount of Substance"
        if UnitsEngine.are_dimensions_equal(dim, LUMINOUS):
            return "Luminous Intensity"
        if UnitsEngine.are_dimensions_equal(dim, AREA_DIM):
            return "Area"
        if UnitsEngine.are_dimensions_equal(dim, VOLUME_DIM):
            return "Volume"
        if UnitsEngine.are_dimensions_equal(dim, VELOCITY_DIM):
            return "Velocity / Speed"
        if UnitsEngine.are_dimensions_equal(dim, ACCELERATION_DIM):
            return "Acceleration"
        if UnitsEngine.are_dimensions_equal(dim, FORCE_DIM):
            return "Force / Weight (Newtons)"
        if UnitsEngine.are_dimensions_equal(dim, ENERGY_DIM):
            return "Energy / Work / Heat / Torque (Joules)"
        if UnitsEngine.are_dimensions_equal(dim, POWER_DIM):
            return "Power / Radiant Flux (Watts)"
        if UnitsEngine.are_dimensions_equal(dim, PRESSURE_DIM):
            return "Pressure / Stress (Pascals)"
        if UnitsEngine.are_dimensions_equal(dim, CHARGE_DIM):
            return "Electric Charge (Coulombs)"
        if UnitsEngine.are_dimensions_equal(dim, VOLTAGE_DIM):
            return "Voltage / Potential (Volts)"
        if UnitsEngine.are_dimensions_equal(dim, RESISTANCE_DIM):
            return "Electrical Resistance (Ohms)"
        if UnitsEngine.are_dimensions_equal(dim, CAPACITANCE_DIM):
            return "Electrical Capacitance (Farads)"
        if UnitsEngine.are_dimensions_equal(dim, FREQUENCY_DIM):
            return "Frequency (Hertz)"
        if UnitsEngine.are_dimensions_equal(dim, DENSITY_DIM):
            return "Mass Density (kg/m³)"
        return UnitsEngine.format_dimension_vector(dim)

    # Master Unit Dictionary: {symbol: {name, category, dimensions, scale, offset}}
    UNITS = {
        # Length (Base: m)
        "m": {"name": "Meter", "category": "Length", "dimensions": LENGTH, "scale": 1.0},
        "km": {"name": "Kilometer", "category": "Length", "dimensions": LENGTH, "scale": 1000.0},
        "cm": {"name": "Centimeter", "category": "Length", "dimensions": LENGTH, "scale": 0.01},
        "mm": {"name": "Millimeter", "category": "Length", "dimensions": LENGTH, "scale": 0.001},
        "um": {"name": "Micrometer", "category": "Length", "dimensions": LENGTH, "scale": 1e-6},
        "nm": {"name": "Nanometer", "category": "Length", "dimensions": LENGTH, "scale": 1e-9},
        "mi": {"name": "Mile", "category": "Length", "dimensions": LENGTH, "scale": 1609.344},
        "yd": {"name": "Yard", "category": "Length", "dimensions": LENGTH, "scale": 0.9144},
        "ft": {"name": "Foot", "category": "Length", "dimensions": LENGTH, "scale": 0.3048},
        "in": {"name": "Inch", "category": "Length", "dimensions": LENGTH, "scale": 0.0254},
        "ly": {"name": "Light Year", "category": "Length", "dimensions": LENGTH, "scale": 9.4607e15},

        # Mass (Base: kg)
        "kg": {"name": "Kilogram", "category": "Mass", "dimensions": MASS, "scale": 1.0},
        "g": {"name": "Gram", "category": "Mass", "dimensions": MASS, "scale": 0.001},
        "mg": {"name": "Milligram", "category": "Mass", "dimensions": MASS, "scale": 1e-6},
        "lb": {"name": "Pound", "category": "Mass", "dimensions": MASS, "scale": 0.45359237},
        "oz": {"name": "Ounce", "category": "Mass", "dimensions": MASS, "scale": 0.028349523125},
        "ton": {"name": "Metric Ton", "category": "Mass", "dimensions": MASS, "scale": 1000.0},

        # Time (Base: s)
        "s": {"name": "Second", "category": "Time", "dimensions": TIME, "scale": 1.0},
        "ms": {"name": "Millisecond", "category": "Time", "dimensions": TIME, "scale": 0.001},
        "us": {"name": "Microsecond", "category": "Time", "dimensions": TIME, "scale": 1e-6},
        "ns": {"name": "Nanosecond", "category": "Time", "dimensions": TIME, "scale": 1e-9},
        "min": {"name": "Minute", "category": "Time", "dimensions": TIME, "scale": 60.0},
        "hr": {"name": "Hour", "category": "Time", "dimensions": TIME, "scale": 3600.0},
        "day": {"name": "Day", "category": "Time", "dimensions": TIME, "scale": 86400.0},
        "yr": {"name": "Year", "category": "Time", "dimensions": TIME, "scale": 31557600.0},

        # Temperature (Base: K)
        "K": {"name": "Kelvin", "category": "Temperature", "dimensions": TEMPERATURE, "scale": 1.0, "offset": 0.0},
        "degC": {"name": "Celsius", "category": "Temperature", "dimensions": TEMPERATURE, "scale": 1.0, "offset": 273.15},
        "degF": {"name": "Fahrenheit", "category": "Temperature", "dimensions": TEMPERATURE, "scale": 5.0 / 9.0, "offset": 255.37222222222223},

        # Force (Base: N = kg*m/s^2)
        "N": {"name": "Newton", "category": "Force", "dimensions": FORCE_DIM, "scale": 1.0},
        "kN": {"name": "Kilonewton", "category": "Force", "dimensions": FORCE_DIM, "scale": 1000.0},
        "lbf": {"name": "Pound-force", "category": "Force", "dimensions": FORCE_DIM, "scale": 4.4482216152605},

        # Energy (Base: J = kg*m^2/s^2)
        "J": {"name": "Joule", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 1.0},
        "kJ": {"name": "Kilojoule", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 1000.0},
        "MJ": {"name": "Megajoule", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 1e6},
        "cal": {"name": "Calorie", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 4.184},
        "kcal": {"name": "Kilocalorie", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 4184.0},
        "eV": {"name": "Electronvolt", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 1.602176634e-19},
        "kWh": {"name": "Kilowatt-hour", "category": "Energy", "dimensions": ENERGY_DIM, "scale": 3.6e6},

        # Power (Base: W = J/s)
        "W": {"name": "Watt", "category": "Power", "dimensions": POWER_DIM, "scale": 1.0},
        "kW": {"name": "Kilowatt", "category": "Power", "dimensions": POWER_DIM, "scale": 1000.0},
        "MW": {"name": "Megawatt", "category": "Power", "dimensions": POWER_DIM, "scale": 1e6},
        "hp": {"name": "Horsepower", "category": "Power", "dimensions": POWER_DIM, "scale": 745.6998715822702},

        # Pressure (Base: Pa = N/m^2)
        "Pa": {"name": "Pascal", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 1.0},
        "kPa": {"name": "Kilopascal", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 1000.0},
        "MPa": {"name": "Megapascal", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 1e6},
        "bar": {"name": "Bar", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 100000.0},
        "atm": {"name": "Standard Atmosphere", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 101325.0},
        "psi": {"name": "Pounds per square inch", "category": "Pressure", "dimensions": PRESSURE_DIM, "scale": 6894.757293168361},

        # Electricity
        "A": {"name": "Ampere", "category": "Electric Current", "dimensions": CURRENT, "scale": 1.0},
        "V": {"name": "Volt", "category": "Voltage", "dimensions": VOLTAGE_DIM, "scale": 1.0},
        "ohm": {"name": "Ohm", "category": "Resistance", "dimensions": RESISTANCE_DIM, "scale": 1.0},
        "C": {"name": "Coulomb", "category": "Electric Charge", "dimensions": CHARGE_DIM, "scale": 1.0},
        "F": {"name": "Farad", "category": "Capacitance", "dimensions": CAPACITANCE_DIM, "scale": 1.0},
        "Hz": {"name": "Hertz", "category": "Frequency", "dimensions": FREQUENCY_DIM, "scale": 1.0},
    }

    # Physics Constants
    CONSTANTS = {
        "c": {"symbol": "c", "name": "Speed of Light in Vacuum", "value": 299792458, "unit": "m/s", "dimensions": VELOCITY_DIM},
        "G": {"symbol": "G", "name": "Newtonian Constant of Gravitation", "value": 6.67430e-11, "unit": "m³/(kg·s²)", "dimensions": [-1, 3, -2, 0, 0, 0, 0]},
        "h": {"symbol": "h", "name": "Planck Constant", "value": 6.62607015e-34, "unit": "J·s", "dimensions": [1, 2, -1, 0, 0, 0, 0]},
        "e": {"symbol": "e", "name": "Elementary Charge", "value": 1.602176634e-19, "unit": "C", "dimensions": CHARGE_DIM},
        "m_e": {"symbol": "m_e", "name": "Electron Mass", "value": 9.1093837015e-31, "unit": "kg", "dimensions": MASS},
        "k_B": {"symbol": "k_B", "name": "Boltzmann Constant", "value": 1.380649e-23, "unit": "J/K", "dimensions": [1, 2, -2, 0, -1, 0, 0]},
        "N_A": {"symbol": "N_A", "name": "Avogadro Constant", "value": 6.02214076e23, "unit": "1/mol", "dimensions": [0, 0, 0, 0, 0, -1, 0]},
        "g_0": {"symbol": "g_0", "name": "Standard Gravity", "value": 9.80665, "unit": "m/s²", "dimensions": ACCELERATION_DIM},
    }

    @staticmethod
    def convert_unit(value: float, from_unit_symbol: str, to_unit_symbol: str) -> Dict[str, Any]:
        u1 = UnitsEngine.UNITS.get(from_unit_symbol)
        u2 = UnitsEngine.UNITS.get(to_unit_symbol)

        if not u1:
            raise ValueError(f"Unknown source unit symbol: {from_unit_symbol}")
        if not u2:
            raise ValueError(f"Unknown target unit symbol: {to_unit_symbol}")

        if not UnitsEngine.are_dimensions_equal(u1["dimensions"], u2["dimensions"]):
            raise ValueError(
                f"Dimensional mismatch: Cannot convert '{from_unit_symbol}' ({UnitsEngine.identify_quantity_name(u1['dimensions'])}) "
                f"to '{to_unit_symbol}' ({UnitsEngine.identify_quantity_name(u2['dimensions'])})."
            )

        # Temperature offset conversion handling
        if "offset" in u1 or "offset" in u2:
            # First convert to base unit Kelvin
            if from_unit_symbol == "degC":
                base_val = value + 273.15
            elif from_unit_symbol == "degF":
                base_val = (value - 32.0) * (5.0 / 9.0) + 273.15
            else:
                base_val = value * u1["scale"]

            # Convert Kelvin to target
            if to_unit_symbol == "degC":
                res = base_val - 273.15
            elif to_unit_symbol == "degF":
                res = (base_val - 273.15) * (9.0 / 5.0) + 32.0
            else:
                res = base_val / u2["scale"]
        else:
            base_val = value * u1["scale"]
            res = base_val / u2["scale"]

        return {
            "value": res,
            "from_value": value,
            "from_unit": from_unit_symbol,
            "to_unit": to_unit_symbol,
            "dimension_name": UnitsEngine.identify_quantity_name(u1["dimensions"]),
            "dimension_vector": u1["dimensions"],
            "base_si_value": base_val
        }

    @staticmethod
    def evaluate_compound_unit(val1: float, unit1: str, op: str, val2: float, unit2: str) -> Dict[str, Any]:
        u1 = UnitsEngine.UNITS.get(unit1)
        u2 = UnitsEngine.UNITS.get(unit2)
        if not u1 or not u2:
            raise ValueError("Invalid unit symbols.")

        dim1 = u1["dimensions"]
        dim2 = u2["dimensions"]

        if op == "+" or op == "-":
            if not UnitsEngine.are_dimensions_equal(dim1, dim2):
                raise ValueError(
                    f"Inconsistent Dimensions: Cannot {op} {unit1} ({UnitsEngine.identify_quantity_name(dim1)}) "
                    f"and {unit2} ({UnitsEngine.identify_quantity_name(dim2)})."
                )
            base_val1 = val1 * u1["scale"]
            base_val2 = val2 * u2["scale"]
            res_base = base_val1 + base_val2 if op == "+" else base_val1 - base_val2
            res_user = res_base / u1["scale"]
            res_dim = dim1
            res_unit = unit1
        elif op == "*":
            base_val1 = val1 * u1["scale"]
            base_val2 = val2 * u2["scale"]
            res_base = base_val1 * base_val2
            res_dim = [dim1[i] + dim2[i] for i in range(7)]
            res_user = res_base
            res_unit = "SI Base"
        elif op == "/":
            base_val1 = val1 * u1["scale"]
            base_val2 = val2 * u2["scale"]
            if base_val2 == 0:
                raise ZeroDivisionError("Division by zero quantity.")
            res_base = base_val1 / base_val2
            res_dim = [dim1[i] - dim2[i] for i in range(7)]
            res_user = res_base
            res_unit = "SI Base"
        else:
            raise ValueError(f"Unsupported compound operator: {op}")

        return {
            "result_base_val": res_base,
            "result_user_val": res_user,
            "result_dimensions": res_dim,
            "dimension_name": UnitsEngine.identify_quantity_name(res_dim),
            "formatted_dimensions": UnitsEngine.format_dimension_vector(res_dim)
        }

    @staticmethod
    def solve_physics_formula(formula_id: str, inputs: Dict[str, float]) -> Dict[str, Any]:
        if formula_id == "newton_f_ma":
            m = inputs.get("m", 1.0)
            a = inputs.get("a", 9.80665)
            f = m * a
            return {
                "formula": "F = m · a",
                "result_value": f,
                "result_unit": "N",
                "dimension_name": "Force (Newtons)",
                "steps": [f"F = ({m:g} kg) × ({a:g} m/s²) = {f:.8g} N"]
            }
        elif formula_id == "kinetic_energy":
            m = inputs.get("m", 2.0)
            v = inputs.get("v", 10.0)
            ek = 0.5 * m * (v ** 2)
            return {
                "formula": "E_k = (1/2) · m · v²",
                "result_value": ek,
                "result_unit": "J",
                "dimension_name": "Energy (Joules)",
                "steps": [f"E_k = 0.5 × ({m:g} kg) × ({v:g} m/s)² = {ek:.8g} J"]
            }
        elif formula_id == "ohms_law":
            i = inputs.get("i", 2.0)
            r = inputs.get("r", 50.0)
            v = i * r
            return {
                "formula": "V = I · R",
                "result_value": v,
                "result_unit": "V",
                "dimension_name": "Voltage (Volts)",
                "steps": [f"V = ({i:g} A) × ({r:g} Ω) = {v:.8g} V"]
            }
        else:
            raise ValueError(f"Unknown physics formula: {formula_id}")
