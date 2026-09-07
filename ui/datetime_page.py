"""
Desktop Date & Time Calculator Page for OmniCalc Pro.
Provides four native sections/tabs:
1. Date Difference & Working Days
2. Add / Subtract Time
3. Age & Birthday Countdown
4. Work Hours & Wage Tracker
"""
from __future__ import annotations
import datetime
from typing import Optional

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QTabWidget, QScrollArea
)
from PySide6.QtCore import Qt

from core.datetime_engine import (
    DateTimeEngine, DateDiffResult, AddSubResult, AgeResult, WorkHoursResult
)
from core.history_manager import get_history_manager


class DateTimePage(QWidget):
    """Native desktop implementation of the Date & Time Calculator."""

    def __init__(self) -> None:
        super().__init__()
        self.engine = DateTimeEngine()
        self.last_diff_result: Optional[DateDiffResult] = None
        self.last_add_sub_result: Optional[AddSubResult] = None
        self.last_age_result: Optional[AgeResult] = None
        self.last_work_result: Optional[WorkHoursResult] = None
        self.setup_ui()

    def setup_ui(self) -> None:
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # Title
        title = QLabel("📅 Date & Time Calculator")
        title.setObjectName("Title")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        main_layout.addWidget(title)

        # Mode Selection ComboBox (kept in sync with QTabWidget for dual accessibility)
        mode_bar = QHBoxLayout()
        mode_label = QLabel("Section:")
        mode_label.setObjectName("Subtitle")
        mode_bar.addWidget(mode_label)

        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Date Difference & Working Days",
            "Add / Subtract Time",
            "Age & Birthday Countdown",
            "Work Hours & Wage Tracker"
        ])
        mode_bar.addWidget(self.mode_combo, 1)
        main_layout.addLayout(mode_bar)

        # Tab Widget for native section switching
        self.tabs = QTabWidget()
        self.tabs.setObjectName("DateTimeTabs")

        # Tab 0: Date Difference
        self.diff_tab = self._create_diff_tab()
        self.tabs.addTab(self.diff_tab, "Date Difference")

        # Tab 1: Add / Subtract
        self.add_sub_tab = self._create_add_sub_tab()
        self.tabs.addTab(self.add_sub_tab, "Add / Subtract")

        # Tab 2: Age / Birthday
        self.age_tab = self._create_age_tab()
        self.tabs.addTab(self.age_tab, "Age / Birthday")

        # Tab 3: Work Hours / Wage
        self.work_tab = self._create_work_tab()
        self.tabs.addTab(self.work_tab, "Work Hours / Wage")

        main_layout.addWidget(self.tabs, 1)

        # Synchronize ComboBox and Tabs
        self.mode_combo.currentIndexChanged.connect(self._on_combo_index_changed)
        self.tabs.currentChanged.connect(self._on_tab_index_changed)

    def _on_combo_index_changed(self, idx: int) -> None:
        if self.tabs.currentIndex() != idx:
            self.tabs.setCurrentIndex(idx)

    def _on_tab_index_changed(self, idx: int) -> None:
        if self.mode_combo.currentIndex() != idx:
            self.mode_combo.setCurrentIndex(idx)

    # --------------------------------------------------------------------------
    # Tab 0: Date Difference
    # --------------------------------------------------------------------------
    def _create_diff_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        today_str = datetime.date.today().isoformat()

        inputs_group = QGroupBox("Date Range")
        form = QFormLayout(inputs_group)

        # Start Date
        start_box = QHBoxLayout()
        self.start_date_input = QLineEdit(today_str)
        self.start_date_input.setPlaceholderText("YYYY-MM-DD")
        start_box.addWidget(self.start_date_input)
        start_today_btn = QPushButton("Today")
        start_today_btn.clicked.connect(lambda: self.start_date_input.setText(datetime.date.today().isoformat()))
        start_box.addWidget(start_today_btn)
        form.addRow("Start Date:", start_box)

        # End Date
        end_box = QHBoxLayout()
        future_date = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
        self.end_date_input = QLineEdit(future_date)
        self.end_date_input.setPlaceholderText("YYYY-MM-DD")
        end_box.addWidget(self.end_date_input)
        end_today_btn = QPushButton("Today")
        end_today_btn.clicked.connect(lambda: self.end_date_input.setText(datetime.date.today().isoformat()))
        end_box.addWidget(end_today_btn)
        form.addRow("End Date:", end_box)

        layout.addWidget(inputs_group)

        # Action Button
        self.diff_btn = QPushButton("Calculate Date Difference")
        self.diff_btn.clicked.connect(self.calculate_date_diff)
        layout.addWidget(self.diff_btn)

        # Results Display
        out_group = QGroupBox("Difference & Working Days Analysis")
        out_layout = QVBoxLayout(out_group)
        self.diff_output = QTextEdit()
        self.diff_output.setReadOnly(True)
        self.diff_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.diff_output)
        layout.addWidget(out_group, 1)

        return widget

    def calculate_date_diff(self) -> None:
        s_date = self.start_date_input.text().strip()
        e_date = self.end_date_input.text().strip()

        try:
            res = self.engine.date_difference(s_date, e_date)
            self.last_diff_result = res
            summary = res.summary_text()
            self.diff_output.setPlainText(summary)

            expr = f"DateDiff({s_date}, {e_date})"
            res_str = f"{res.total_days} days ({res.work_days} workdays)"
            try:
                get_history_manager().add_entry(expr, res_str)
            except Exception:
                pass
        except Exception as e:
            self.last_diff_result = None
            self.diff_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Tab 1: Add / Subtract Time
    # --------------------------------------------------------------------------
    def _create_add_sub_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Date & Offset Values")
        form = QFormLayout(inputs_group)

        # Base Date
        base_box = QHBoxLayout()
        self.base_date_input = QLineEdit(datetime.date.today().isoformat())
        self.base_date_input.setPlaceholderText("YYYY-MM-DD")
        base_box.addWidget(self.base_date_input)
        base_today_btn = QPushButton("Today")
        base_today_btn.clicked.connect(lambda: self.base_date_input.setText(datetime.date.today().isoformat()))
        base_box.addWidget(base_today_btn)
        form.addRow("Starting Date:", base_box)

        # Operation
        self.op_combo = QComboBox()
        self.op_combo.addItems(["Add (+)", "Subtract (-)"])
        form.addRow("Operation:", self.op_combo)

        # Offsets
        self.years_input = QLineEdit("0")
        self.months_input = QLineEdit("0")
        self.weeks_input = QLineEdit("0")
        self.days_input = QLineEdit("0")
        form.addRow("Years to Offset:", self.years_input)
        form.addRow("Months to Offset:", self.months_input)
        form.addRow("Weeks to Offset:", self.weeks_input)
        form.addRow("Days to Offset:", self.days_input)

        layout.addWidget(inputs_group)

        # Action Button
        self.add_sub_btn = QPushButton("Calculate Target Date")
        self.add_sub_btn.clicked.connect(self.calculate_add_sub)
        layout.addWidget(self.add_sub_btn)

        # Results Display
        out_group = QGroupBox("Calculated Date Result")
        out_layout = QVBoxLayout(out_group)
        self.add_sub_output = QTextEdit()
        self.add_sub_output.setReadOnly(True)
        self.add_sub_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.add_sub_output)
        layout.addWidget(out_group, 1)

        return widget

    def calculate_add_sub(self) -> None:
        base_d = self.base_date_input.text().strip()
        op_text = "add" if self.op_combo.currentIndex() == 0 else "subtract"

        try:
            y = int(self.years_input.text().strip() or "0")
            m = int(self.months_input.text().strip() or "0")
            w = int(self.weeks_input.text().strip() or "0")
            d = int(self.days_input.text().strip() or "0")

            res = self.engine.add_subtract_date(base_d, op_text, y, m, w, d)
            self.last_add_sub_result = res
            self.add_sub_output.setPlainText(res.summary_text())

            expr = f"DateOffset({base_d} {op_text} {y}y {m}m {w}w {d}d)"
            try:
                get_history_manager().add_entry(expr, res.iso_date)
            except Exception:
                pass
        except Exception as e:
            self.last_add_sub_result = None
            self.add_sub_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Tab 2: Age / Birthday
    # --------------------------------------------------------------------------
    def _create_age_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Birthday Parameters")
        form = QFormLayout(inputs_group)

        self.birth_date_input = QLineEdit("2000-01-01")
        self.birth_date_input.setPlaceholderText("YYYY-MM-DD")
        form.addRow("Birth Date (DOB):", self.birth_date_input)

        as_of_box = QHBoxLayout()
        self.as_of_input = QLineEdit()
        self.as_of_input.setPlaceholderText("Today (leave blank or YYYY-MM-DD)")
        as_of_box.addWidget(self.as_of_input)
        as_of_today_btn = QPushButton("Today")
        as_of_today_btn.clicked.connect(lambda: self.as_of_input.setText(datetime.date.today().isoformat()))
        as_of_box.addWidget(as_of_today_btn)
        form.addRow("As of Date (Optional):", as_of_box)

        layout.addWidget(inputs_group)

        # Action Button
        self.age_btn = QPushButton("Calculate Age & Countdown")
        self.age_btn.clicked.connect(self.calculate_age)
        layout.addWidget(self.age_btn)

        # Results Display
        out_group = QGroupBox("Age & Birthday Breakdown")
        out_layout = QVBoxLayout(out_group)
        self.age_output = QTextEdit()
        self.age_output.setReadOnly(True)
        self.age_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.age_output)
        layout.addWidget(out_group, 1)

        return widget

    def calculate_age(self) -> None:
        dob_text = self.birth_date_input.text().strip()
        as_of_text = self.as_of_input.text().strip() or None

        try:
            res = self.engine.age_and_birthday(dob_text, as_of_text)
            self.last_age_result = res
            self.age_output.setPlainText(res.summary_text())

            expr = f"Age({dob_text})"
            try:
                get_history_manager().add_entry(expr, res.age_str)
            except Exception:
                pass
        except Exception as e:
            self.last_age_result = None
            self.age_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Tab 3: Work Hours / Wage
    # --------------------------------------------------------------------------
    def _create_work_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        inputs_group = QGroupBox("Shift & Wage Settings")
        form = QFormLayout(inputs_group)

        self.work_start_input = QLineEdit("09:00")
        self.work_start_input.setPlaceholderText("HH:MM (e.g. 09:00)")
        form.addRow("Shift Start Time:", self.work_start_input)

        self.work_end_input = QLineEdit("17:30")
        self.work_end_input.setPlaceholderText("HH:MM (e.g. 17:30 or 02:00 next day)")
        form.addRow("Shift End Time:", self.work_end_input)

        self.break_mins_input = QLineEdit("45")
        self.break_mins_input.setPlaceholderText("Minutes (e.g. 30)")
        form.addRow("Unpaid Break (Minutes):", self.break_mins_input)

        self.hourly_rate_input = QLineEdit("25.00")
        self.hourly_rate_input.setPlaceholderText("Rate per hour (e.g. 25.00)")
        form.addRow("Hourly Wage / Rate ($):", self.hourly_rate_input)

        layout.addWidget(inputs_group)

        # Action Button
        self.work_btn = QPushButton("Calculate Hours & Earnings")
        self.work_btn.clicked.connect(self.calculate_work_hours)
        layout.addWidget(self.work_btn)

        # Results Display
        out_group = QGroupBox("Shift Summary & Total Earnings")
        out_layout = QVBoxLayout(out_group)
        self.work_output = QTextEdit()
        self.work_output.setReadOnly(True)
        self.work_output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.work_output)
        layout.addWidget(out_group, 1)

        return widget

    def calculate_work_hours(self) -> None:
        start_t = self.work_start_input.text().strip()
        end_t = self.work_end_input.text().strip()

        try:
            brk = int(self.break_mins_input.text().strip() or "0")
            rate = float(self.hourly_rate_input.text().strip() or "0")

            res = self.engine.work_hours_and_wage(start_t, end_t, brk, rate)
            self.last_work_result = res
            self.work_output.setPlainText(res.summary_text())

            expr = f"WorkHours({start_t} - {end_t}, break={brk}m, rate=${rate})"
            res_str = f"{res.net_time_str} (${res.earnings:,.2f})"
            try:
                get_history_manager().add_entry(expr, res_str)
            except Exception:
                pass
        except Exception as e:
            self.last_work_result = None
            self.work_output.setPlainText(f"Error: {e}")

    # --------------------------------------------------------------------------
    # Common Actions & Integration
    # --------------------------------------------------------------------------
    def calculate(self) -> None:
        """Trigger calculation for the currently selected tab."""
        idx = self.tabs.currentIndex()
        if idx == 0:
            self.calculate_date_diff()
        elif idx == 1:
            self.calculate_add_sub()
        elif idx == 2:
            self.calculate_age()
        elif idx == 3:
            self.calculate_work_hours()

    def clear_expression(self) -> None:
        """Clear the output and reset input fields of the currently selected tab."""
        idx = self.tabs.currentIndex()
        if idx == 0:
            self.diff_output.clear()
            self.last_diff_result = None
        elif idx == 1:
            self.add_sub_output.clear()
            self.last_add_sub_result = None
        elif idx == 2:
            self.age_output.clear()
            self.last_age_result = None
        elif idx == 3:
            self.work_output.clear()
            self.last_work_result = None
