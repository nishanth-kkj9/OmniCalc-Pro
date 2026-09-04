import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.calculus_page import CalculusPage


class TestCalculusPage(unittest.TestCase):
    def test_derivative_ui(self):
        page = CalculusPage()
        page.mode_combo.setCurrentIndex(0)  # Derivative
        page.d1_expr.setText("x**3 - 3*x + 2")
        page.d1_x0.setText("2")
        page.calculate()
        output_text = page.output.toPlainText()
        self.assertIn("f'(2) = 9", output_text)

    def test_integration_ui(self):
        page = CalculusPage()
        page.mode_combo.setCurrentIndex(2)  # Integration
        page.integ_expr.setText("sin(x)")
        page.integ_a.setText("0")
        page.integ_b.setText("3.141592653589793")
        page.integ_method.setCurrentText("simpson")
        page.calculate()
        output_text = page.output.toPlainText()
        self.assertIn("Integral Value = 2", output_text)

    def test_tangent_normal_ui(self):
        page = CalculusPage()
        page.mode_combo.setCurrentIndex(3)  # Tangent & Normal
        page.tan_expr.setText("x**2")
        page.tan_x0.setText("2")
        page.calculate()
        output_text = page.output.toPlainText()
        self.assertIn("y = 4*x - 4", output_text)
        self.assertIn("y = -0.25*x + 4.5", output_text)

    def test_newton_raphson_ui(self):
        page = CalculusPage()
        page.mode_combo.setCurrentIndex(5)  # Newton-Raphson
        page.nr_expr.setText("x**2 - 2")
        page.nr_x0.setText("1.0")
        page.calculate()
        output_text = page.output.toPlainText()
        self.assertIn("1.4142136", output_text)

    def test_area_between_curves_ui(self):
        page = CalculusPage()
        page.mode_combo.setCurrentIndex(6)  # Area Between Curves
        page.area_f1.setText("x")
        page.area_f2.setText("x**2")
        page.area_a.setText("0")
        page.area_b.setText("1")
        page.calculate()
        output_text = page.output.toPlainText()
        self.assertIn("0.16666667", output_text)


if __name__ == "__main__":
    unittest.main()
