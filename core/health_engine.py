"""
Health & Fitness Engine for OmniCalc Pro.
Provides pure, standard-library-based biometric and metabolic calculations:
1. Body Mass Index (BMI) with category classification and healthy weight ranges (Metric & Imperial).
2. Basal Metabolic Rate (BMR) via Mifflin-St Jeor equation and Total Daily Energy Expenditure (TDEE).
3. Karvonen Target Heart Rate Training Zones with Heart Rate Reserve (HRR).
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List


@dataclass
class BMIResult:
    bmi: float
    category: str
    weight: float
    height: float
    unit: str  # "metric" | "imperial"
    healthy_min_weight: float
    healthy_max_weight: float
    category_color: str  # Hex or CSS class hint

    def summary_text(self) -> str:
        unit_w = "kg" if self.unit == "metric" else "lbs"
        unit_h = "cm" if self.unit == "metric" else "in"
        return (
            f"Calculated BMI: {self.bmi:.1f}\n"
            f"Classification: {self.category}\n"
            f"Input: {self.weight} {unit_w}, {self.height} {unit_h}\n"
            f"Healthy Weight Range (18.5 - 24.9 BMI): "
            f"{self.healthy_min_weight:.1f} - {self.healthy_max_weight:.1f} {unit_w}"
        )


@dataclass
class BMRTDEEResult:
    bmr: int
    tdee: int
    deficit500: int
    surplus500: int
    gender: str
    age: int
    activity_name: str
    activity_multiplier: float
    weight_kg: float
    height_cm: float

    def summary_text(self) -> str:
        return (
            f"Basal Metabolic Rate (BMR): {self.bmr} kcal/day\n"
            f"Total Daily Energy Expenditure (TDEE): {self.tdee} kcal/day\n"
            f"Target for Mild Weight Loss (-500 kcal): {self.deficit500} kcal/day\n"
            f"Target for Mild Weight Gain (+500 kcal): {self.surplus500} kcal/day\n"
            f"Parameters: {self.gender.title()}, {self.age} yrs | {self.activity_name} ({self.activity_multiplier}x)"
        )


@dataclass
class HeartRateZone:
    name: str
    min_bpm: int
    max_bpm: int
    min_exact: float
    max_exact: float


@dataclass
class HeartRateResult:
    age: int
    resting_hr: int
    max_hr: int
    hrr: int  # Heart Rate Reserve
    zones: List[HeartRateZone]

    def summary_text(self) -> str:
        lines = [
            f"Maximum Heart Rate: {self.max_hr} BPM",
            f"Resting Heart Rate: {self.resting_hr} BPM",
            f"Heart Rate Reserve (HRR): {self.hrr} BPM",
            "\nTraining Zones (Karvonen formula):"
        ]
        for z in self.zones:
            lines.append(f"  • {z.name}: {z.min_bpm} - {z.max_bpm} BPM")
        return "\n".join(lines)


class HealthEngine:
    """Pure domain logic for Health & Fitness calculations."""

    ACTIVITY_LEVELS = [
        ("Sedentary (Little or no exercise)", 1.2),
        ("Lightly Active (1-3 days/wk)", 1.375),
        ("Moderately Active (3-5 days/wk)", 1.55),
        ("Very Active (6-7 days/wk)", 1.725),
        ("Extra Active (Physical job/training)", 1.9),
    ]

    @staticmethod
    def calculate_bmi(
        weight: float,
        height: float,
        unit: str = "metric"
    ) -> BMIResult:
        """
        Calculate Body Mass Index (BMI).
        Metric: weight in kg, height in cm.
        Imperial: weight in lbs, height in inches.
        """
        if weight <= 0 or height <= 0:
            raise ValueError("Weight and height must be positive numbers greater than zero.")

        unit_clean = unit.strip().lower()
        if unit_clean == "metric":
            h_m = height / 100.0
            raw_bmi = weight / (h_m * h_m)
            # Healthy range: 18.5 to 24.9
            min_healthy_w = 18.5 * (h_m * h_m)
            max_healthy_w = 24.9 * (h_m * h_m)
        elif unit_clean == "imperial":
            raw_bmi = (703.0 * weight) / (height * height)
            min_healthy_w = (18.5 * height * height) / 703.0
            max_healthy_w = (24.9 * height * height) / 703.0
        else:
            raise ValueError(f"Unknown unit '{unit}'. Use 'metric' or 'imperial'.")

        bmi = round(raw_bmi, 1)

        # Categories matching web HealthCalculator lines 49-61
        if bmi < 18.5:
            category = "Underweight"
            color = "#f59e0b"  # Amber
        elif bmi < 24.9:
            category = "Normal weight (Healthy)"
            color = "#10b981"  # Emerald
        elif bmi < 29.9:
            category = "Overweight"
            color = "#eab308"  # Yellow
        else:
            category = "Obese"
            color = "#f43f5e"  # Rose

        return BMIResult(
            bmi=bmi,
            category=category,
            weight=weight,
            height=height,
            unit=unit_clean,
            healthy_min_weight=round(min_healthy_w, 1),
            healthy_max_weight=round(max_healthy_w, 1),
            category_color=color,
        )

    @staticmethod
    def calculate_bmr_tdee(
        weight: float,
        height: float,
        age: int,
        gender: str = "male",
        activity: float = 1.375,
        unit: str = "metric",
    ) -> BMRTDEEResult:
        """
        Calculate Basal Metabolic Rate (BMR) via Mifflin-St Jeor equation and TDEE.
        """
        if weight <= 0 or height <= 0:
            raise ValueError("Weight and height must be positive numbers.")
        if age <= 0 or age > 130:
            raise ValueError("Age must be between 1 and 130 years.")
        if activity <= 0:
            raise ValueError("Activity multiplier must be positive.")

        unit_clean = unit.strip().lower()
        if unit_clean == "metric":
            w_kg = weight
            h_cm = height
        elif unit_clean == "imperial":
            w_kg = weight * 0.453592
            h_cm = height * 2.54
        else:
            raise ValueError(f"Unknown unit '{unit}'. Use 'metric' or 'imperial'.")

        gender_clean = gender.strip().lower()
        if gender_clean in ("male", "m"):
            s_offset = 5.0
            canonical_gender = "male"
        elif gender_clean in ("female", "f"):
            s_offset = -161.0
            canonical_gender = "female"
        else:
            raise ValueError(f"Gender must be 'male' or 'female', got '{gender}'.")

        # Mifflin-St Jeor Equation
        bmr = 10.0 * w_kg + 6.25 * h_cm - 5.0 * age + s_offset
        tdee = bmr * activity
        deficit500 = tdee - 500.0
        surplus500 = tdee + 500.0

        # Activity label lookup
        activity_name = "Custom Activity"
        for name, mult in HealthEngine.ACTIVITY_LEVELS:
            if abs(mult - activity) < 0.001:
                activity_name = name
                break

        return BMRTDEEResult(
            bmr=int(round(bmr)),
            tdee=int(round(tdee)),
            deficit500=int(round(deficit500)),
            surplus500=int(round(surplus500)),
            gender=canonical_gender,
            age=age,
            activity_name=activity_name,
            activity_multiplier=activity,
            weight_kg=round(w_kg, 2),
            height_cm=round(h_cm, 2),
        )

    @staticmethod
    def calculate_heart_rate(
        age: int,
        resting_hr: int = 65
    ) -> HeartRateResult:
        """
        Calculate Karvonen Target Heart Rate training zones.
        """
        if age <= 0 or age >= 220:
            raise ValueError("Age must be between 1 and 219 years.")
        if resting_hr < 30 or resting_hr > 200:
            raise ValueError("Resting heart rate must be between 30 and 200 BPM.")

        max_hr = 220 - age
        if resting_hr >= max_hr:
            raise ValueError("Resting heart rate cannot equal or exceed maximum heart rate (220 - age).")

        hrr = max_hr - resting_hr

        # Karvonen Zones matching web HealthCalculator lines 95-107
        zone_defs = [
            ("Warm-up / Light (50-60%)", resting_hr + hrr * 0.5, resting_hr + hrr * 0.6),
            ("Fat Burn / Aerobic (60-70%)", resting_hr + hrr * 0.6, resting_hr + hrr * 0.7),
            ("Endurance / Cardio (70-80%)", resting_hr + hrr * 0.7, resting_hr + hrr * 0.8),
            ("Anaerobic / Hard (80-90%)", resting_hr + hrr * 0.8, resting_hr + hrr * 0.9),
            ("Peak / Maximum (90-100%)", resting_hr + hrr * 0.9, float(max_hr)),
        ]

        zones = [
            HeartRateZone(
                name=name,
                min_bpm=int(round(min_val)),
                max_bpm=int(round(max_val)),
                min_exact=min_val,
                max_exact=max_val,
            )
            for name, min_val, max_val in zone_defs
        ]

        return HeartRateResult(
            age=age,
            resting_hr=resting_hr,
            max_hr=max_hr,
            hrr=hrr,
            zones=zones,
        )
