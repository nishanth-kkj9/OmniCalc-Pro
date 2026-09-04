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
    def test_regression_page_models_and_prediction(self):
        page = RegressionPage()

        # 1. Linear Regression Fit & Residuals
        page.x_input.setText("1, 2, 3, 4, 5")
        page.y_input.setText("2, 4, 6, 8, 10")
        page.model_combo.setCurrentIndex(0)  # Linear
        page.calculate_regression()
        self.assertIn("y = 2.0000x + 0.0000", page.output.toPlainText())
        self.assertIn("R² (Coefficient of Determination): 1.000000", page.output.toPlainText())
        self.assertIn("Residual Analysis Table:", page.output.toPlainText())
        self.assertIsNotNone(page.last_fit_result)

        # Forward Prediction
        page.pred_x_input.setText("6")
        page.predict_y()
        self.assertIn("Predicted Y = 12.000000", page.pred_result_lbl.text())

        # Inverse Prediction
        page.pred_y_input.setText("14")
        page.predict_x()
        self.assertIn("Predicted X ≈ 7.000000", page.inv_result_lbl.text())

        # 2. Polynomial Regression Fit
        page.x_input.setText("1, 2, 3, 4, 5")
        page.y_input.setText("1, 4, 9, 16, 25")
        page.model_combo.setCurrentIndex(1)  # Polynomial
        page.degree_spin.setValue(2)
        page.calculate_regression()
        self.assertIn("1.0000x^2", page.output.toPlainText())

        # 3. Exponential Regression Fit
        page.x_input.setText("0, 1, 2, 3")
        page.y_input.setText("1, 2.7182818, 7.389056, 20.085537")
        page.model_combo.setCurrentIndex(2)  # Exponential
        page.calculate_regression()
        self.assertIn("exponential", page.output.toPlainText())

        # 4. Logarithmic Regression Fit
        page.x_input.setText("1, 2, 3, 4")
        page.y_input.setText("0, 0.693147, 1.098612, 1.386294")
        page.model_combo.setCurrentIndex(3)  # Logarithmic
        page.calculate_regression()
        self.assertIn("logarithmic", page.output.toPlainText())

        # 5. Power Regression Fit
        page.x_input.setText("1, 2, 3, 4")
        page.y_input.setText("1, 4, 9, 16")
        page.model_combo.setCurrentIndex(4)  # Power
        page.calculate_regression()
        self.assertIn("power", page.output.toPlainText())

        # 6. Invalid Input Error Handling
        page.x_input.setText("1, 2")
        page.y_input.setText("-1, -2")
        page.model_combo.setCurrentIndex(2)  # Exponential with y <= 0
        page.calculate_regression()
        self.assertIn("Error:", page.output.toPlainText())

    def test_probability_page_distributions(self):
        page = ProbabilityPage()

        # 1. Normal Distribution
        page.dist_combo.setCurrentIndex(0)
        page.param1_input.setText("0.0")
        page.param2_input.setText("1.0")
        page.val_input.setText("0.0")
        page.interval_input.setText("-1.0, 1.0")
        page.calculate()
        self.assertIn("CDF P(X <= x) = 0.500000", page.output.toPlainText())
        self.assertIn("Mean (E[X]): 0.000000", page.output.toPlainText())
        self.assertIn("Interval Probability P(-1.0 <= X <= 1.0) = 0.682689", page.output.toPlainText())

        # 2. Student's t-Distribution
        page.dist_combo.setCurrentIndex(1)
        page.param1_input.setText("10")
        page.val_input.setText("1.96")
        page.calculate()
        self.assertIn("STUDENT'S t-DISTRIBUTION", page.output.toPlainText())

        # 3. Chi-Square Distribution
        page.dist_combo.setCurrentIndex(2)
        page.param1_input.setText("5")
        page.val_input.setText("11.07")
        page.calculate()
        self.assertIn("CHI-SQUARE DISTRIBUTION", page.output.toPlainText())

        # 4. Binomial Distribution
        page.dist_combo.setCurrentIndex(3)
        page.param1_input.setText("10")
        page.param2_input.setText("0.5")
        page.val_input.setText("5")
        page.calculate()
        self.assertIn("PMF P(X = k) = 0.246094", page.output.toPlainText())

        # 5. Poisson Distribution
        page.dist_combo.setCurrentIndex(4)
        page.param1_input.setText("3.0")
        page.val_input.setText("3")
        page.calculate()
        self.assertIn("POISSON DISTRIBUTION", page.output.toPlainText())

        # 6. Exponential Distribution
        page.dist_combo.setCurrentIndex(5)
        page.param1_input.setText("1.5")
        page.val_input.setText("1.0")
        page.calculate()
        self.assertIn("EXPONENTIAL DISTRIBUTION", page.output.toPlainText())

        # 7. Bernoulli Distribution
        page.dist_combo.setCurrentIndex(6)
        page.param1_input.setText("0.6")
        page.val_input.setText("1")
        page.calculate()
        self.assertIn("BERNOULLI DISTRIBUTION", page.output.toPlainText())

        # 8. Geometric Distribution
        page.dist_combo.setCurrentIndex(7)
        page.param1_input.setText("0.3")
        page.val_input.setText("3")
        page.calculate()
        self.assertIn("GEOMETRIC DISTRIBUTION", page.output.toPlainText())

        # 9. Uniform Distribution
        page.dist_combo.setCurrentIndex(8)
        page.param1_input.setText("0.0")
        page.param2_input.setText("10.0")
        page.val_input.setText("5.0")
        page.calculate()
        self.assertIn("UNIFORM DISTRIBUTION", page.output.toPlainText())

        # 10. Invalid Parameter Handling
        page.dist_combo.setCurrentIndex(0)
        page.param2_input.setText("-1.0")  # Invalid std
        page.calculate()
        self.assertIn("Error:", page.output.toPlainText())

    def test_inference_page_tests(self):
        page = InferencePage()

        # 1. Z-Test
        page.test_combo.setCurrentIndex(0)
        page.field1_input.setText("10.5")
        page.field2_input.setText("30")
        page.field3_input.setText("2.0")
        page.field4_input.setText("10.0")
        page.run_test()
        self.assertIn("One-Sample Z-Test", page.output.toPlainText())
        self.assertIn("Test Statistic:", page.output.toPlainText())

        # 2. 1-Sample t-Test
        page.test_combo.setCurrentIndex(1)
        page.field1_input.setText("10.5")
        page.field2_input.setText("2.5")
        page.field3_input.setText("25")
        page.field4_input.setText("10.0")
        page.run_test()
        self.assertIn("One-Sample Student's t-Test", page.output.toPlainText())

        # 3. 2-Sample t-Test
        page.test_combo.setCurrentIndex(2)
        page.field1_input.setText("12.5, 2.1, 20")
        page.field2_input.setText("10.1, 1.9, 22")
        page.field3_input.setText("0.0")
        page.run_test()
        self.assertIn("Two-Sample t-Test", page.output.toPlainText())

        # 4. Paired t-Test
        page.test_combo.setCurrentIndex(3)
        page.field1_input.setText("1.2")
        page.field2_input.setText("0.8")
        page.field3_input.setText("15")
        page.field4_input.setText("0.0")
        page.run_test()
        self.assertIn("Paired Samples t-Test", page.output.toPlainText())

        # 5. One-Sample Proportion Z-Test
        page.test_combo.setCurrentIndex(4)
        page.field1_input.setText("45")
        page.field2_input.setText("100")
        page.field3_input.setText("0.5")
        page.run_test()
        self.assertIn("One-Sample Proportion Z-Test", page.output.toPlainText())

        # 6. Two-Sample Proportions Z-Test
        page.test_combo.setCurrentIndex(5)
        page.field1_input.setText("45, 100")
        page.field2_input.setText("30, 100")
        page.run_test()
        self.assertIn("Two-Sample Proportions Z-Test", page.output.toPlainText())

        # 7. Chi-Square Goodness-of-Fit
        page.test_combo.setCurrentIndex(6)
        page.field1_input.setText("20, 25, 15, 40")
        page.field2_input.setText("25, 25, 25, 25")
        page.run_test()
        self.assertIn("Chi-Square Goodness-of-Fit", page.output.toPlainText())

        # 8. Chi-Square Test of Independence
        page.test_combo.setCurrentIndex(7)
        page.anova_text.setText("Row1: 10, 20, 30\nRow2: 20, 15, 25")
        page.run_test()
        self.assertIn("Chi-Square Test of Independence", page.output.toPlainText())

        # 9. One-Way ANOVA
        page.test_combo.setCurrentIndex(8)
        page.anova_text.setText("Group1: 12, 14, 15, 11\nGroup2: 18, 17, 21, 19\nGroup3: 22, 24, 20, 25")
        page.run_test()
        self.assertIn("One-Way ANOVA", page.output.toPlainText())

        # 10. Invalid Input Handling
        page.test_combo.setCurrentIndex(0)
        page.field2_input.setText("-5")  # Invalid n
        page.run_test()
        self.assertIn("Error:", page.output.toPlainText())


if __name__ == "__main__":
    unittest.main()

