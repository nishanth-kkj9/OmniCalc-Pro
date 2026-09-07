"""
Unit and integration tests for DateTimeEngine and DateTimePage.
Covers:
1. Date difference & working days (Monday-Friday inclusion, weekend exclusion)
2. Add / Subtract date arithmetic, month overflows, leap year boundaries
3. Age & birthday countdown, leap year birthdays, deterministic comparison dates
4. Work hours & wage calculations, overnight shifts, unpaid break deductions
5. PySide6 DateTimePage UI controls, tab switching, input handling, error paths
6. MainWindow page_factories registration and lazy instantiation
"""
import unittest
import os
import sys
import datetime

os.environ["QT_QPA_PLATFORM"] = "offscreen"

try:
    from PySide6.QtWidgets import QApplication
    app = QApplication.instance() or QApplication(sys.argv)
    from ui.datetime_page import DateTimePage
    from ui.main_window import MainWindow, get_default_page_factories
    from ui.sidebar import PAGE_NAMES, SIDE_ICONS
    HAS_PYSIDE6 = True
except ImportError:
    HAS_PYSIDE6 = False
    DateTimePage = None  # type: ignore
    MainWindow = None  # type: ignore
    get_default_page_factories = None  # type: ignore
    PAGE_NAMES = []  # type: ignore
    SIDE_ICONS = []  # type: ignore

from core.datetime_engine import DateTimeEngine


class TestDateTimeEngine(unittest.TestCase):
    """Pure computational engine tests."""

    def test_date_difference_basic(self):
        diff = DateTimeEngine.date_difference("2026-01-01", "2026-01-11")
        self.assertEqual(diff.total_days, 10)
        self.assertEqual(diff.total_weeks, 1)
        self.assertEqual(diff.rem_days, 3)
        self.assertEqual(diff.total_hours, 240)
        self.assertEqual(diff.total_minutes, 14400)
        self.assertEqual(diff.total_seconds, 864000)

    def test_date_difference_working_days(self):
        # 2026-09-07 is Monday, 2026-09-11 is Friday -> 5 working days
        diff = DateTimeEngine.date_difference("2026-09-07", "2026-09-11")
        self.assertEqual(diff.total_days, 4)
        self.assertEqual(diff.work_days, 5)

        # 2026-09-07 (Mon) to 2026-09-13 (Sun) -> 5 working days (Sat, Sun excluded)
        diff_weekend = DateTimeEngine.date_difference("2026-09-07", "2026-09-13")
        self.assertEqual(diff_weekend.total_days, 6)
        self.assertEqual(diff_weekend.work_days, 5)

    def test_date_difference_order_invariance(self):
        diff1 = DateTimeEngine.date_difference("2026-01-01", "2026-05-01")
        diff2 = DateTimeEngine.date_difference("2026-05-01", "2026-01-01")
        self.assertEqual(diff1.total_days, diff2.total_days)
        self.assertEqual(diff1.work_days, diff2.work_days)
        self.assertEqual(diff1.years, diff2.years)
        self.assertEqual(diff1.months, diff2.months)
        self.assertEqual(diff1.days, diff2.days)

    def test_add_subtract_basic(self):
        res = DateTimeEngine.add_subtract_date("2026-01-01", "add", years=1, months=2, weeks=1, days=3)
        # 2026-01-01 + 1y 2m = 2027-03-01; + 10 days = 2027-03-11
        self.assertEqual(res.iso_date, "2027-03-11")

        sub_res = DateTimeEngine.add_subtract_date("2027-03-11", "subtract", years=1, months=2, weeks=1, days=3)
        self.assertEqual(sub_res.iso_date, "2026-01-01")

    def test_add_subtract_month_overflow_and_leap_year(self):
        # Jan 31 + 1 month overflows Feb to March
        res = DateTimeEngine.add_subtract_date("2024-01-31", "add", months=1)
        # 2024 is leap year: Feb has 29 days, so day 31 rolls into March 2nd
        self.assertEqual(res.iso_date, "2024-03-02")

        # 2023 non-leap: Jan 31 + 1 month rolls to March 3rd
        res_non_leap = DateTimeEngine.add_subtract_date("2023-01-31", "add", months=1)
        self.assertEqual(res_non_leap.iso_date, "2023-03-03")

    def test_age_and_birthday(self):
        as_of = datetime.date(2026, 9, 7)
        # DOB 2000-01-01 as of 2026-09-07: 26y 8m 6d
        age = DateTimeEngine.age_and_birthday("2000-01-01", as_of=as_of)
        self.assertEqual(age.years, 26)
        self.assertEqual(age.months, 8)
        self.assertEqual(age.days, 6)
        self.assertEqual(age.total_days_lived, 9746)
        self.assertEqual(age.next_bday_date, datetime.date(2027, 1, 1))
        self.assertEqual(age.days_until_next_bday, 116)

    def test_age_birthday_today(self):
        as_of = datetime.date(2026, 9, 7)
        age = DateTimeEngine.age_and_birthday("2000-09-07", as_of=as_of)
        self.assertEqual(age.years, 26)
        self.assertEqual(age.months, 0)
        self.assertEqual(age.days, 0)
        self.assertEqual(age.days_until_next_bday, 0)

    def test_age_leap_day_birthday(self):
        # Born Feb 29, 2004; as of Jan 1, 2025 (non-leap year)
        age = DateTimeEngine.age_and_birthday("2004-02-29", as_of=datetime.date(2025, 1, 1))
        # Next birthday in 2025 rolls to March 1st
        self.assertEqual(age.next_bday_date, datetime.date(2025, 3, 1))
        self.assertEqual(age.days_until_next_bday, 59)

    def test_age_future_dob_error(self):
        with self.assertRaises(ValueError):
            DateTimeEngine.age_and_birthday("2030-01-01", as_of=datetime.date(2026, 1, 1))

    def test_work_hours_day_shift(self):
        work = DateTimeEngine.work_hours_and_wage("09:00", "17:30", break_minutes=45, hourly_rate=25.0)
        self.assertEqual(work.net_time_str, "7h 45m")
        self.assertEqual(work.decimal_hours, 7.75)
        self.assertEqual(work.earnings, 193.75)
        self.assertFalse(work.is_overnight)

    def test_work_hours_overnight_shift(self):
        work = DateTimeEngine.work_hours_and_wage("22:00", "06:00", break_minutes=30, hourly_rate=30.0)
        self.assertEqual(work.net_time_str, "7h 30m")
        self.assertEqual(work.decimal_hours, 7.5)
        self.assertEqual(work.earnings, 225.0)
        self.assertTrue(work.is_overnight)

    def test_work_hours_break_exceeds_shift(self):
        work = DateTimeEngine.work_hours_and_wage("09:00", "10:00", break_minutes=90, hourly_rate=20.0)
        self.assertEqual(work.net_minutes, 0)
        self.assertEqual(work.earnings, 0.0)

    def test_work_hours_invalid_inputs(self):
        with self.assertRaises(ValueError):
            DateTimeEngine.work_hours_and_wage("invalid", "17:00")
        with self.assertRaises(ValueError):
            DateTimeEngine.work_hours_and_wage("09:00", "17:00", break_minutes=-10)
        with self.assertRaises(ValueError):
            DateTimeEngine.work_hours_and_wage("09:00", "17:00", hourly_rate=-5.0)


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestDateTimePageUI(unittest.TestCase):
    """UI control, interaction, and validation tests."""

    def setUp(self):
        self.page = DateTimePage()

    def tearDown(self):
        if hasattr(self, "page") and self.page is not None:
            self.page.cleanup()
            self.page.deleteLater()
            self.page = None
        if app is not None:
            app.processEvents()

    def test_tabs_initialization(self):
        self.assertEqual(self.page.tabs.count(), 4)
        tab_names = [self.page.tabs.tabText(i) for i in range(4)]
        self.assertEqual(
            tab_names,
            ["Date Difference", "Add / Subtract", "Age / Birthday", "Work Hours / Wage"]
        )
        self.assertEqual(self.page.mode_combo.count(), 4)

    def test_tab_and_combo_sync(self):
        self.page.mode_combo.setCurrentIndex(2)
        self.assertEqual(self.page.tabs.currentIndex(), 2)

        self.page.tabs.setCurrentIndex(1)
        self.assertEqual(self.page.mode_combo.currentIndex(), 1)

    def test_date_difference_ui_calculation(self):
        self.page.tabs.setCurrentIndex(0)
        self.page.start_date_input.setText("2026-09-01")
        self.page.end_date_input.setText("2026-09-15")
        self.page.calculate_date_diff()

        self.assertIsNotNone(self.page.last_diff_result)
        self.assertEqual(self.page.last_diff_result.total_days, 14)
        out_text = self.page.diff_output.toPlainText()
        self.assertIn("14 days", out_text)
        self.assertIn("Business / Working Days", out_text)

    def test_date_difference_invalid_input(self):
        self.page.tabs.setCurrentIndex(0)
        self.page.start_date_input.setText("not-a-date")
        self.page.calculate_date_diff()
        self.assertIn("Error:", self.page.diff_output.toPlainText())
        self.assertIsNone(self.page.last_diff_result)

    def test_add_subtract_ui_calculation(self):
        self.page.tabs.setCurrentIndex(1)
        self.page.base_date_input.setText("2026-01-15")
        self.page.op_combo.setCurrentIndex(0)  # Add
        self.page.years_input.setText("1")
        self.page.months_input.setText("2")
        self.page.weeks_input.setText("0")
        self.page.days_input.setText("5")
        self.page.calculate_add_sub()

        self.assertIsNotNone(self.page.last_add_sub_result)
        self.assertEqual(self.page.last_add_sub_result.iso_date, "2027-03-20")
        self.assertIn("2027-03-20", self.page.add_sub_output.toPlainText())

    def test_age_ui_calculation(self):
        self.page.tabs.setCurrentIndex(2)
        self.page.birth_date_input.setText("1995-05-20")
        self.page.as_of_input.setText("2025-05-20")
        self.page.calculate_age()

        self.assertIsNotNone(self.page.last_age_result)
        self.assertEqual(self.page.last_age_result.years, 30)
        self.assertIn("30 Years", self.page.age_output.toPlainText())

    def test_work_hours_ui_calculation(self):
        self.page.tabs.setCurrentIndex(3)
        self.page.work_start_input.setText("08:30")
        self.page.work_end_input.setText("17:00")
        self.page.break_mins_input.setText("30")
        self.page.hourly_rate_input.setText("20.00")
        self.page.calculate_work_hours()

        self.assertIsNotNone(self.page.last_work_result)
        self.assertEqual(self.page.last_work_result.net_time_str, "8h 0m")
        self.assertEqual(self.page.last_work_result.earnings, 160.0)
        self.assertIn("$160.00", self.page.work_output.toPlainText())

    def test_common_calculate_and_clear(self):
        # calculate() on active tab
        self.page.tabs.setCurrentIndex(3)
        self.page.work_start_input.setText("09:00")
        self.page.work_end_input.setText("17:00")
        self.page.break_mins_input.setText("0")
        self.page.hourly_rate_input.setText("10.00")
        self.page.calculate()
        self.assertIn("$80.00", self.page.work_output.toPlainText())

        # clear_expression() resets the active tab output
        self.page.clear_expression()
        self.assertEqual(self.page.work_output.toPlainText(), "")


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestMainWindowDateTimeIntegration(unittest.TestCase):
    """Integration checks with MainWindow and Sidebar."""

    def test_sidebar_has_datetime(self):
        self.assertIn("DateTime", PAGE_NAMES)
        idx = PAGE_NAMES.index("DateTime")
        self.assertEqual(len(PAGE_NAMES), len(SIDE_ICONS))
        self.assertEqual(SIDE_ICONS[idx], "\U0001f4c5")

    def test_mainwindow_factory_registration(self):
        factories = get_default_page_factories()
        names = [f[0] for f in factories]
        self.assertIn("DateTime", names)
        dt_idx = names.index("DateTime")
        # Instantiate page via lazy factory
        dt_page = factories[dt_idx][1]()
        self.assertIsInstance(dt_page, DateTimePage)
        if hasattr(dt_page, "cleanup"):
            dt_page.cleanup()
        dt_page.deleteLater()
        if app is not None:
            app.processEvents()


if __name__ == "__main__":
    unittest.main()
