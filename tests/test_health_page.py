"""
Unit and integration tests for HealthEngine and HealthPage.
Covers:
1. Pure domain HealthEngine:
   - Body Mass Index (BMI) calculation (Metric & Imperial)
   - WHO category classification (Underweight, Normal, Overweight, Obese)
   - Healthy weight boundary estimations
   - BMR via Mifflin-St Jeor equation (Male and Female)
   - TDEE daily calorie calculations across activity levels
   - Karvonen Target Heart Rate Reserve (HRR) and 5 training zones
   - Input validation and boundary enforcement
2. Desktop HealthPage UI:
   - Tab initialization and tab-combo synchronization
   - BMI calculation, unit switching, validation, error handling
   - BMR & TDEE calculation, gender, activity multiplier, unit switching
   - Heart Rate calculation, training zone display, error handling
   - Common calculate() and clear_expression() interfaces
   - Cleanup lifecycle stability and signal disconnection
3. Desktop Integration:
   - Sidebar registration and icon alignment
   - MainWindow page_factories registration and lazy instantiation
"""
import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

try:
    from PySide6.QtWidgets import QApplication
    app = QApplication.instance() or QApplication(sys.argv)
    from ui.health_page import HealthPage
    from ui.main_window import MainWindow, get_default_page_factories
    from ui.sidebar import PAGE_NAMES, SIDE_ICONS
    HAS_PYSIDE6 = True
except ImportError:
    HAS_PYSIDE6 = False
    HealthPage = None  # type: ignore
    MainWindow = None  # type: ignore
    get_default_page_factories = None  # type: ignore
    PAGE_NAMES = []  # type: ignore
    SIDE_ICONS = []  # type: ignore

from core.health_engine import HealthEngine


class TestHealthEngine(unittest.TestCase):
    """Pure domain logic tests for HealthEngine."""

    def test_bmi_metric_normal(self):
        # 70 kg, 175 cm -> 70 / (1.75^2) = 22.857... -> 22.9
        res = HealthEngine.calculate_bmi(70, 175, unit="metric")
        self.assertEqual(res.bmi, 22.9)
        self.assertEqual(res.category, "Normal weight (Healthy)")
        self.assertAlmostEqual(res.healthy_min_weight, 56.7, places=1)
        self.assertAlmostEqual(res.healthy_max_weight, 76.3, places=1)
        self.assertIn("Calculated BMI: 22.9", res.summary_text())

    def test_bmi_imperial_normal(self):
        # 154 lbs, 69 in -> (703 * 154) / (69^2) = 22.738... -> 22.7
        res = HealthEngine.calculate_bmi(154, 69, unit="imperial")
        self.assertEqual(res.bmi, 22.7)
        self.assertEqual(res.category, "Normal weight (Healthy)")
        self.assertIn("154 lbs", res.summary_text())

    def test_bmi_categories(self):
        # Underweight: < 18.5
        under = HealthEngine.calculate_bmi(50, 175, unit="metric")
        self.assertLess(under.bmi, 18.5)
        self.assertEqual(under.category, "Underweight")

        # Overweight: 25 - 29.9
        over = HealthEngine.calculate_bmi(80, 175, unit="metric")
        self.assertTrue(24.9 <= over.bmi < 29.9)
        self.assertEqual(over.category, "Overweight")

        # Obese: >= 29.9
        obese = HealthEngine.calculate_bmi(105, 175, unit="metric")
        self.assertGreaterEqual(obese.bmi, 29.9)
        self.assertEqual(obese.category, "Obese")

    def test_bmi_validation_errors(self):
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmi(-10, 175)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmi(70, 0)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmi(70, 175, unit="unknown_unit")

    def test_bmr_tdee_mifflin_male(self):
        # Male, 70kg, 175cm, age 25
        # BMR = 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
        res = HealthEngine.calculate_bmr_tdee(
            weight=70, height=175, age=25, gender="male", activity=1.375, unit="metric"
        )
        self.assertEqual(res.bmr, 1674)
        # TDEE = 1673.75 * 1.375 = 2301.4 -> 2301
        self.assertEqual(res.tdee, 2301)
        self.assertEqual(res.deficit500, 1801)
        self.assertEqual(res.surplus500, 2801)
        self.assertIn("Basal Metabolic Rate", res.summary_text())

    def test_bmr_tdee_mifflin_female(self):
        # Female, 60kg, 165cm, age 30
        # BMR = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
        res = HealthEngine.calculate_bmr_tdee(
            weight=60, height=165, age=30, gender="female", activity=1.55, unit="metric"
        )
        self.assertEqual(res.bmr, 1320)
        # TDEE = 1320.25 * 1.55 = 2046.38 -> 2046
        self.assertEqual(res.tdee, 2046)

    def test_bmr_imperial(self):
        # 154 lbs, 69 in -> ~70kg, ~175cm
        res = HealthEngine.calculate_bmr_tdee(
            weight=154, height=69, age=25, gender="male", activity=1.2, unit="imperial"
        )
        self.assertGreater(res.bmr, 1500)
        self.assertGreater(res.tdee, 1800)

    def test_bmr_validation_errors(self):
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmr_tdee(0, 175, 25)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmr_tdee(70, -10, 25)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmr_tdee(70, 175, -5)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_bmr_tdee(70, 175, 25, gender="alien")

    def test_heart_rate_karvonen(self):
        # Age 30, resting HR 65
        # Max HR = 220 - 30 = 190
        # HRR = 190 - 65 = 125
        res = HealthEngine.calculate_heart_rate(age=30, resting_hr=65)
        self.assertEqual(res.max_hr, 190)
        self.assertEqual(res.hrr, 125)
        self.assertEqual(len(res.zones), 5)

        # Warm-up (50-60%): 65 + 125*0.5 = 127.5 -> 128; 65 + 125*0.6 = 140
        zone0 = res.zones[0]
        self.assertEqual(zone0.min_bpm, 128)
        self.assertEqual(zone0.max_bpm, 140)

        # Peak (90-100%): 65 + 125*0.9 = 177.5 -> 178; 190
        zone4 = res.zones[4]
        self.assertEqual(zone4.min_bpm, 178)
        self.assertEqual(zone4.max_bpm, 190)

        self.assertIn("Maximum Heart Rate: 190 BPM", res.summary_text())

    def test_heart_rate_validation(self):
        with self.assertRaises(ValueError):
            HealthEngine.calculate_heart_rate(age=-1)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_heart_rate(age=30, resting_hr=195)  # >= max_hr (190)
        with self.assertRaises(ValueError):
            HealthEngine.calculate_heart_rate(age=30, resting_hr=20)   # < 30


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestHealthPageUI(unittest.TestCase):
    """UI control, interaction, and validation tests."""

    def setUp(self):
        self.page = HealthPage()

    def tearDown(self):
        if hasattr(self, "page") and self.page is not None:
            self.page.cleanup()
            self.page.deleteLater()
            self.page = None
        if app is not None:
            app.processEvents()

    def test_tabs_initialization(self):
        self.assertEqual(self.page.tabs.count(), 3)
        tab_names = [self.page.tabs.tabText(i) for i in range(3)]
        self.assertEqual(
            tab_names,
            ["Body Mass Index", "BMR & TDEE", "Heart Rate Zones"]
        )
        self.assertEqual(self.page.mode_combo.count(), 3)

    def test_tab_and_combo_sync(self):
        self.page.mode_combo.setCurrentIndex(1)
        self.assertEqual(self.page.tabs.currentIndex(), 1)

        self.page.tabs.setCurrentIndex(2)
        self.assertEqual(self.page.mode_combo.currentIndex(), 2)

    def test_bmi_ui_calculation_metric(self):
        self.page.tabs.setCurrentIndex(0)
        self.page.bmi_unit_combo.setCurrentIndex(0)  # Metric
        self.page.bmi_weight_input.setText("70")
        self.page.bmi_height_input.setText("175")
        self.page.calculate_bmi()

        self.assertIsNotNone(self.page.last_bmi_result)
        self.assertEqual(self.page.last_bmi_result.bmi, 22.9)
        out_text = self.page.bmi_output.toPlainText()
        self.assertIn("Calculated BMI: 22.9", out_text)
        self.assertIn("Normal weight (Healthy)", out_text)

    def test_bmi_ui_unit_switch_and_imperial(self):
        self.page.tabs.setCurrentIndex(0)
        self.page.bmi_unit_combo.setCurrentIndex(1)  # Imperial
        self.assertEqual(self.page.bmi_weight_label.text(), "Weight (lbs):")
        self.assertEqual(self.page.bmi_height_label.text(), "Height (inches):")

        self.page.bmi_weight_input.setText("154")
        self.page.bmi_height_input.setText("69")
        self.page.calculate_bmi()

        self.assertIsNotNone(self.page.last_bmi_result)
        self.assertEqual(self.page.last_bmi_result.bmi, 22.7)

    def test_bmi_ui_invalid_input(self):
        self.page.tabs.setCurrentIndex(0)
        self.page.bmi_weight_input.setText("-50")
        self.page.bmi_height_input.setText("170")
        self.page.calculate_bmi()
        self.assertIn("Please enter positive values", self.page.bmi_output.toPlainText())
        self.assertIsNone(self.page.last_bmi_result)

        self.page.bmi_weight_input.setText("not-a-number")
        self.page.calculate_bmi()
        self.assertIn("Error:", self.page.bmi_output.toPlainText())

    def test_bmr_tdee_ui_calculation(self):
        self.page.tabs.setCurrentIndex(1)
        self.page.bmr_unit_combo.setCurrentIndex(0)  # Metric
        self.page.bmr_gender_combo.setCurrentIndex(0)  # Male
        self.page.bmr_age_input.setText("25")
        self.page.bmr_weight_input.setText("70")
        self.page.bmr_height_input.setText("175")
        self.page.bmr_activity_combo.setCurrentIndex(1)  # Lightly Active (1.375)
        self.page.calculate_bmr_tdee()

        self.assertIsNotNone(self.page.last_bmr_result)
        self.assertEqual(self.page.last_bmr_result.bmr, 1674)
        self.assertEqual(self.page.last_bmr_result.tdee, 2301)
        out_text = self.page.bmr_output.toPlainText()
        self.assertIn("Basal Metabolic Rate (BMR): 1674 kcal/day", out_text)
        self.assertIn("Total Daily Energy Expenditure (TDEE): 2301 kcal/day", out_text)

    def test_heart_rate_ui_calculation(self):
        self.page.tabs.setCurrentIndex(2)
        self.page.hr_age_input.setText("30")
        self.page.hr_resting_input.setText("65")
        self.page.calculate_heart_rate()

        self.assertIsNotNone(self.page.last_hr_result)
        self.assertEqual(self.page.last_hr_result.max_hr, 190)
        out_text = self.page.hr_output.toPlainText()
        self.assertIn("Maximum Heart Rate: 190 BPM", out_text)
        self.assertIn("Warm-up / Light (50-60%)", out_text)

    def test_common_calculate_and_clear(self):
        # Calculate active tab 0
        self.page.tabs.setCurrentIndex(0)
        self.page.bmi_weight_input.setText("70")
        self.page.bmi_height_input.setText("175")
        self.page.calculate()
        self.assertIn("Calculated BMI: 22.9", self.page.bmi_output.toPlainText())

        # Clear expression
        self.page.clear_expression()
        self.assertEqual(self.page.bmi_output.toPlainText(), "")


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestMainWindowHealthIntegration(unittest.TestCase):
    """Integration checks with MainWindow and Sidebar."""

    def test_sidebar_has_health(self):
        self.assertIn("Health", PAGE_NAMES)
        idx = PAGE_NAMES.index("Health")
        self.assertEqual(len(PAGE_NAMES), len(SIDE_ICONS))
        self.assertEqual(SIDE_ICONS[idx], "\u2764\ufe0f")

    def test_mainwindow_factory_registration(self):
        factories = get_default_page_factories()
        names = [f[0] for f in factories]
        self.assertIn("Health", names)
        h_idx = names.index("Health")
        # Instantiate page via lazy factory
        h_page = factories[h_idx][1]()
        self.assertIsInstance(h_page, HealthPage)
        if hasattr(h_page, "cleanup"):
            h_page.cleanup()
        h_page.deleteLater()
        if app is not None:
            app.processEvents()


if __name__ == "__main__":
    unittest.main()
