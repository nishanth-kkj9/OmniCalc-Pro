"""
Desktop Health & Fitness Calculator Page for OmniCalc Pro.
Provides native implementations of:
1. Body Mass Index (BMI) & Weight Category Classification
2. Calorie Needs (BMR via Mifflin-St Jeor & TDEE Daily Energy Expenditure)
3. Target Heart Rate Training Zones (Karvonen HRR Formula)
"""
from __future__ import annotations
from typing import Optional

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QTabWidget
)

from core.health_engine import (
    HealthEngine, BMIResult, BMRTDEEResult, HeartRateResult
)
from core.history_manager import get_history_manager


class HealthPage(QWidget):
    """Native desktop implementation of the Health & Fitness Calculator."""

    def __init__(self) -> None:
        super().__init__()
        self.engine = HealthEngine()
        self.last_bmi_result: Optional[BMIResult] = None
        self.last_bmr_result: Optional[BMRTDEEResult] = None
        self.last_hr_result: Optional[HeartRateResult] = None
        self.setup_ui()

    def setup_ui(self) -> None:
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # Title
        title = QLabel("❤️ Health & Fitness Suite", self)
        title.setObjectName("Title")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        main_layout.addWidget(title)

        # Mode Selection ComboBox (kept in sync with QTabWidget for accessibility)
        mode_bar = QHBoxLayout()
        mode_label = QLabel("Section:", self)
        mode_label.setObjectName("Subtitle")
        mode_bar.addWidget(mode_label)

        self.mode_combo = QComboBox(self)
        self.mode_combo.addItems([
            "Body Mass Index (BMI)",
            "Calorie Needs (BMR & TDEE)",
            "Target Heart Rate Zones (Karvonen)"
        ])
        mode_bar.addWidget(self.mode_combo, 1)
        main_layout.addLayout(mode_bar)

        # Tab Widget for native section switching
        self.tabs = QTabWidget(self)
        self.tabs.setObjectName("HealthTabs")

        # Tab 0: BMI
        self.bmi_tab = self._create_bmi_tab()
        self.tabs.addTab(self.bmi_tab, "Body Mass Index")

        # Tab 1: BMR & TDEE
        self.bmr_tab = self._create_bmr_tdee_tab()
        self.tabs.addTab(self.bmr_tab, "BMR & TDEE")

        # Tab 2: Heart Rate
        self.hr_tab = self._create_heart_rate_tab()
        self.tabs.addTab(self.hr_tab, "Heart Rate Zones")

        main_layout.addWidget(self.tabs, 1)

        # Synchronize ComboBox and Tabs
        self.mode_combo.currentIndexChanged.connect(self._on_combo_index_changed)
        self.tabs.currentChanged.connect(self._on_tab_index_changed)

    def cleanup(self) -> None:
        """Safely disconnect signals to prevent crash during Qt teardown."""
        try:
            self.mode_combo.blockSignals(True)
            self.tabs.blockSignals(True)
        except Exception:
            pass
        try:
            self.mode_combo.currentIndexChanged.disconnect(self._on_combo_index_changed)
        except Exception:
            pass
        try:
            self.tabs.currentChanged.disconnect(self._on_tab_index_changed)
        except Exception:
            pass

    def closeEvent(self, event) -> None:
        self.cleanup()
        super().closeEvent(event)

    def _on_combo_index_changed(self, idx: int) -> None:
        if idx < 0 or idx >= self.tabs.count():
            return
        if self.tabs.currentIndex() != idx:
            self.tabs.setCurrentIndex(idx)

    def _on_tab_index_changed(self, idx: int) -> None:
        if idx < 0 or idx >= self.mode_combo.count():
            return
        if self.mode_combo.currentIndex() != idx:
            self.mode_combo.setCurrentIndex(idx)

    # --------------------------------------------------------------------------
    # Tab 0: Body Mass Index (BMI)
    # --------------------------------------------------------------------------
    def _create_bmi_tab(self) -> QWidget:
        widget = QWidget(self.tabs)
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Biometric Parameters", widget)
        form = QFormLayout(inputs_group)

        # Unit Selection
        self.bmi_unit_combo = QComboBox(inputs_group)
        self.bmi_unit_combo.addItems(["Metric (kg, cm)", "Imperial (lbs, inches)"])
        self.bmi_unit_combo.currentIndexChanged.connect(self._on_bmi_unit_changed)
        form.addRow("Measurement System:", self.bmi_unit_combo)

        # Weight Input
        self.bmi_weight_label = QLabel("Weight (kg):", inputs_group)
        self.bmi_weight_input = QLineEdit("70", inputs_group)
        self.bmi_weight_input.setPlaceholderText("e.g. 70")
        form.addRow(self.bmi_weight_label, self.bmi_weight_input)

        # Height Input
        self.bmi_height_label = QLabel("Height (cm):", inputs_group)
        self.bmi_height_input = QLineEdit("175", inputs_group)
        self.bmi_height_input.setPlaceholderText("e.g. 175")
        form.addRow(self.bmi_height_label, self.bmi_height_input)

        layout.addWidget(inputs_group)

        # Action Button
        self.bmi_calc_btn = QPushButton("Calculate BMI", widget)
        self.bmi_calc_btn.clicked.connect(self.calculate_bmi)
        layout.addWidget(self.bmi_calc_btn)

        # Results Display
        out_group = QGroupBox("Calculated BMI & Classification", widget)
        out_layout = QVBoxLayout(out_group)
        self.bmi_output = QTextEdit(out_group)
        self.bmi_output.setReadOnly(True)
        self.bmi_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.bmi_output)
        layout.addWidget(out_group, 1)

        return widget

    def _on_bmi_unit_changed(self, idx: int) -> None:
        if idx == 0:  # Metric
            self.bmi_weight_label.setText("Weight (kg):")
            self.bmi_weight_input.setPlaceholderText("e.g. 70")
            self.bmi_weight_input.setText("70")
            self.bmi_height_label.setText("Height (cm):")
            self.bmi_height_input.setPlaceholderText("e.g. 175")
            self.bmi_height_input.setText("175")
        else:  # Imperial
            self.bmi_weight_label.setText("Weight (lbs):")
            self.bmi_weight_input.setPlaceholderText("e.g. 154")
            self.bmi_weight_input.setText("154")
            self.bmi_height_label.setText("Height (inches):")
            self.bmi_height_input.setPlaceholderText("e.g. 69")
            self.bmi_height_input.setText("69")

    def calculate_bmi(self) -> None:
        try:
            w_text = self.bmi_weight_input.text().strip()
            h_text = self.bmi_height_input.text().strip()
            if not w_text or not h_text:
                raise ValueError("Please enter weight and height values.")

            w = float(w_text)
            h = float(h_text)
            if w <= 0 or h <= 0:
                self.last_bmi_result = None
                self.bmi_output.setPlainText("Please enter positive values")
                return

            unit = "metric" if self.bmi_unit_combo.currentIndex() == 0 else "imperial"
            res = self.engine.calculate_bmi(w, h, unit=unit)
            self.last_bmi_result = res
            self.bmi_output.setPlainText(res.summary_text())

            unit_tag = "kg,cm" if unit == "metric" else "lbs,in"
            expr = f"BMI({w}, {h} {unit_tag})"
            try:
                get_history_manager().add_entry(expr, f"{res.bmi} ({res.category})")
            except Exception:
                pass
        except Exception as e:
            self.last_bmi_result = None
            self.bmi_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Tab 1: Calorie Needs (BMR & TDEE)
    # --------------------------------------------------------------------------
    def _create_bmr_tdee_tab(self) -> QWidget:
        widget = QWidget(self.tabs)
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Metabolic & Lifestyle Parameters", widget)
        form = QFormLayout(inputs_group)

        # Unit System
        self.bmr_unit_combo = QComboBox(inputs_group)
        self.bmr_unit_combo.addItems(["Metric (kg, cm)", "Imperial (lbs, in)"])
        self.bmr_unit_combo.currentIndexChanged.connect(self._on_bmr_unit_changed)
        form.addRow("Units:", self.bmr_unit_combo)

        # Gender
        self.bmr_gender_combo = QComboBox(inputs_group)
        self.bmr_gender_combo.addItems(["Male", "Female"])
        form.addRow("Biological Sex:", self.bmr_gender_combo)

        # Age
        self.bmr_age_input = QLineEdit("25", inputs_group)
        self.bmr_age_input.setPlaceholderText("Years (e.g. 25)")
        form.addRow("Age (Years):", self.bmr_age_input)

        # Weight
        self.bmr_weight_label = QLabel("Weight (kg):", inputs_group)
        self.bmr_weight_input = QLineEdit("70", inputs_group)
        self.bmr_weight_input.setPlaceholderText("e.g. 70")
        form.addRow(self.bmr_weight_label, self.bmr_weight_input)

        # Height
        self.bmr_height_label = QLabel("Height (cm):", inputs_group)
        self.bmr_height_input = QLineEdit("175", inputs_group)
        self.bmr_height_input.setPlaceholderText("e.g. 175")
        form.addRow(self.bmr_height_label, self.bmr_height_input)

        # Activity Level
        self.bmr_activity_combo = QComboBox(inputs_group)
        for label, _ in HealthEngine.ACTIVITY_LEVELS:
            self.bmr_activity_combo.addItem(label)
        self.bmr_activity_combo.setCurrentIndex(1)  # Lightly Active
        form.addRow("Activity Level:", self.bmr_activity_combo)

        layout.addWidget(inputs_group)

        # Action Button
        self.bmr_calc_btn = QPushButton("Calculate BMR & TDEE", widget)
        self.bmr_calc_btn.clicked.connect(self.calculate_bmr_tdee)
        layout.addWidget(self.bmr_calc_btn)

        # Results Display
        out_group = QGroupBox("Daily Caloric Energy Targets", widget)
        out_layout = QVBoxLayout(out_group)
        self.bmr_output = QTextEdit(out_group)
        self.bmr_output.setReadOnly(True)
        self.bmr_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.bmr_output)
        layout.addWidget(out_group, 1)

        return widget

    def _on_bmr_unit_changed(self, idx: int) -> None:
        if idx == 0:  # Metric
            self.bmr_weight_label.setText("Weight (kg):")
            self.bmr_weight_input.setPlaceholderText("e.g. 70")
            self.bmr_weight_input.setText("70")
            self.bmr_height_label.setText("Height (cm):")
            self.bmr_height_input.setPlaceholderText("e.g. 175")
            self.bmr_height_input.setText("175")
        else:  # Imperial
            self.bmr_weight_label.setText("Weight (lbs):")
            self.bmr_weight_input.setPlaceholderText("e.g. 154")
            self.bmr_weight_input.setText("154")
            self.bmr_height_label.setText("Height (inches):")
            self.bmr_height_input.setPlaceholderText("e.g. 69")
            self.bmr_height_input.setText("69")

    def calculate_bmr_tdee(self) -> None:
        try:
            w_text = self.bmr_weight_input.text().strip()
            h_text = self.bmr_height_input.text().strip()
            age_text = self.bmr_age_input.text().strip()

            if not w_text or not h_text or not age_text:
                raise ValueError("Please provide weight, height, and age.")

            w = float(w_text)
            h = float(h_text)
            age = int(age_text)
            gender = self.bmr_gender_combo.currentText().lower()
            unit = "metric" if self.bmr_unit_combo.currentIndex() == 0 else "imperial"

            act_idx = self.bmr_activity_combo.currentIndex()
            activity_mult = HealthEngine.ACTIVITY_LEVELS[act_idx][1]

            res = self.engine.calculate_bmr_tdee(
                weight=w,
                height=h,
                age=age,
                gender=gender,
                activity=activity_mult,
                unit=unit
            )
            self.last_bmr_result = res
            self.bmr_output.setPlainText(res.summary_text())

            expr = f"BMR/TDEE({gender}, {age}y, {w}, {h})"
            try:
                get_history_manager().add_entry(expr, f"BMR: {res.bmr} kcal, TDEE: {res.tdee} kcal")
            except Exception:
                pass
        except Exception as e:
            self.last_bmr_result = None
            self.bmr_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Tab 2: Karvonen Target Heart Rate Zones
    # --------------------------------------------------------------------------
    def _create_heart_rate_tab(self) -> QWidget:
        widget = QWidget(self.tabs)
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Heart Rate Parameters", widget)
        form = QFormLayout(inputs_group)

        self.hr_age_input = QLineEdit("30", inputs_group)
        self.hr_age_input.setPlaceholderText("Years (e.g. 30)")
        form.addRow("Age (Years):", self.hr_age_input)

        self.hr_resting_input = QLineEdit("65", inputs_group)
        self.hr_resting_input.setPlaceholderText("Beats per minute (e.g. 65)")
        form.addRow("Resting Heart Rate (BPM):", self.hr_resting_input)

        layout.addWidget(inputs_group)

        # Action Button
        self.hr_calc_btn = QPushButton("Calculate Heart Rate Zones", widget)
        self.hr_calc_btn.clicked.connect(self.calculate_heart_rate)
        layout.addWidget(self.hr_calc_btn)

        # Results Display
        out_group = QGroupBox("Calculated Training Zones (Karvonen HRR)", widget)
        out_layout = QVBoxLayout(out_group)
        self.hr_output = QTextEdit(out_group)
        self.hr_output.setReadOnly(True)
        self.hr_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.hr_output)
        layout.addWidget(out_group, 1)

        return widget

    def calculate_heart_rate(self) -> None:
        try:
            age_text = self.hr_age_input.text().strip()
            rhr_text = self.hr_resting_input.text().strip()

            if not age_text or not rhr_text:
                raise ValueError("Please provide age and resting heart rate.")

            age = int(age_text)
            rhr = int(rhr_text)

            res = self.engine.calculate_heart_rate(age=age, resting_hr=rhr)
            self.last_hr_result = res
            self.hr_output.setPlainText(res.summary_text())

            expr = f"HeartRate(Age {age}, RHR {rhr})"
            try:
                get_history_manager().add_entry(expr, f"Max {res.max_hr} BPM, HRR {res.hrr} BPM")
            except Exception:
                pass
        except Exception as e:
            self.last_hr_result = None
            self.hr_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Common Controller Interface
    # --------------------------------------------------------------------------
    def calculate(self) -> None:
        """Calculate the active tab's parameters."""
        idx = self.tabs.currentIndex()
        if idx == 0:
            self.calculate_bmi()
        elif idx == 1:
            self.calculate_bmr_tdee()
        elif idx == 2:
            self.calculate_heart_rate()

    def clear_expression(self) -> None:
        """Reset or clear the current tab's output."""
        idx = self.tabs.currentIndex()
        if idx == 0:
            self.last_bmi_result = None
            self.bmi_output.clear()
        elif idx == 1:
            self.last_bmr_result = None
            self.bmr_output.clear()
        elif idx == 2:
            self.last_hr_result = None
            self.hr_output.clear()
