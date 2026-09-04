import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.fractions_page import FractionsPage


class TestFractionsPage(unittest.TestCase):
    def test_arithmetic_ui(self):
        page = FractionsPage()
        page.mode_combo.setCurrentIndex(0)
        page.f1_num.setText("3")
        page.f1_den.setText("4")
        page.f2_num.setText("2")
        page.f2_den.setText("5")
        page.frac_op.setCurrentIndex(0)  # +
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("23 / 20", text)
        self.assertIn("1 3/20", text)

    def test_gcd_lcm_ui(self):
        page = FractionsPage()
        page.mode_combo.setCurrentIndex(1)
        page.gcd_input.setText("48, 180, 24")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Greatest Common Divisor (GCD): 12", text)
        self.assertIn("Least Common Multiple (LCM):   360", text)

    def test_prime_factorization_ui(self):
        page = FractionsPage()
        page.mode_combo.setCurrentIndex(2)
        page.prime_input.setText("360")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("2^3 · 3^2 · 5", text)
        self.assertIn("Total Divisors Count:  24", text)


if __name__ == "__main__":
    unittest.main()
