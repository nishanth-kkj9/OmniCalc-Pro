import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.equation_page import EquationPage


class TestEquationPage(unittest.TestCase):
    def test_quadratic_solver_ui(self):
        page = EquationPage()
        page.mode_combo.setCurrentIndex(0)  # Quadratic
        page.quad_a.setText("1")
        page.quad_b.setText("-5")
        page.quad_c.setText("6")
        page.solve()
        output_text = page.output.toPlainText()
        self.assertIn("Discriminant Δ: 1", output_text)
        self.assertIn("x1 = 2", output_text)
        self.assertIn("x2 = 3", output_text)

    def test_cubic_solver_ui(self):
        page = EquationPage()
        page.mode_combo.setCurrentIndex(1)  # Cubic
        page.cubic_a.setText("1")
        page.cubic_b.setText("-6")
        page.cubic_c.setText("11")
        page.cubic_d.setText("-6")
        page.solve()
        output_text = page.output.toPlainText()
        self.assertIn("x1 = 1", output_text)
        self.assertIn("x2 = 2", output_text)
        self.assertIn("x3 = 3", output_text)

    def test_linear_system_2x2_ui(self):
        page = EquationPage()
        page.mode_combo.setCurrentIndex(2)  # Linear 2x2
        page.sys2_a1.setText("2"); page.sys2_b1.setText("3"); page.sys2_c1.setText("8")
        page.sys2_a2.setText("1"); page.sys2_b2.setText("-1"); page.sys2_c2.setText("1")
        page.solve()
        output_text = page.output.toPlainText()
        self.assertIn("x = 2.2, y = 1.2", output_text)

    def test_linear_system_3x3_ui(self):
        page = EquationPage()
        page.mode_combo.setCurrentIndex(3)  # Linear 3x3
        page.sys3_a1.setText("1"); page.sys3_b1.setText("1"); page.sys3_c1.setText("1"); page.sys3_d1.setText("6")
        page.sys3_a2.setText("0"); page.sys3_b2.setText("2"); page.sys3_c2.setText("5"); page.sys3_d2.setText("-4")
        page.sys3_a3.setText("2"); page.sys3_b3.setText("5"); page.sys3_c3.setText("-1"); page.sys3_d3.setText("27")
        page.solve()
        output_text = page.output.toPlainText()
        self.assertIn("x = 7, y = 3, z = -4", output_text)

    def test_single_equation_ui(self):
        page = EquationPage()
        page.mode_combo.setCurrentIndex(4)  # Single Equation
        page.single_expr.setText("x**3 - 2*x - 5")
        page.single_min.setText("-5")
        page.single_max.setText("5")
        page.solve()
        output_text = page.output.toPlainText()
        self.assertIn("2.094551", output_text)


if __name__ == "__main__":
    unittest.main()
