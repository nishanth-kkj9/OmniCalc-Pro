import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.regression_page import RegressionPage
from ui.probability_page import ProbabilityPage
from ui.inference_page import InferencePage


class TestDesktopPages(unittest.TestCase):
    def test_regression_page(self):
        page = RegressionPage()
        page.x_input.setText("1, 2, 3, 4, 5")
        page.y_input.setText("2, 4, 6, 8, 10")
        page.calculate_regression()
        self.assertIn("y = 2.0000x + 0.0000", page.output.toPlainText())
        self.assertIsNotNone(page.last_fit_result)

        page.pred_x_input.setText("6")
        page.predict_y()
        self.assertIn("Predicted Y = 12.000000", page.pred_result_lbl.text())

    def test_probability_page(self):
        page = ProbabilityPage()
        page.dist_combo.setCurrentIndex(0)  # Normal
        page.val_input.setText("0.0")
        page.calculate()
        self.assertIn("CDF P(X <= x) = 0.500000", page.output.toPlainText())

        page.dist_combo.setCurrentIndex(3)  # Binomial
        page.param1_input.setText("10")
        page.param2_input.setText("0.5")
        page.val_input.setText("5")
        page.calculate()
        self.assertIn("PMF P(X = k) = 0.246094", page.output.toPlainText())

    def test_inference_page(self):
        page = InferencePage()
        page.test_combo.setCurrentIndex(0)  # Z-test
        page.field1_input.setText("10.5")
        page.field2_input.setText("30")
        page.field3_input.setText("2.0")
        page.field4_input.setText("10.0")
        page.run_test()
        self.assertIn("One-Sample Z-Test", page.output.toPlainText())
        self.assertIn("Test Statistic:", page.output.toPlainText())


if __name__ == "__main__":
    unittest.main()
