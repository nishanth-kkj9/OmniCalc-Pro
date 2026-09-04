import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.complex_page import ComplexPage
from core.complex_engine import ComplexEngine


class TestComplexPage(unittest.TestCase):
    def test_representations_ui(self):
        page = ComplexPage()
        page.mode_combo.setCurrentIndex(0)
        page.rep_z.setText("3 + 4i")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("3 + 4i", text)
        self.assertIn("5 ∠ 53.13", text)

    def test_arithmetic_ui(self):
        page = ComplexPage()
        page.mode_combo.setCurrentIndex(1)
        page.arith_z1.setText("1 + 2i")
        page.arith_z2.setText("3 + 4i")
        page.arith_op.setCurrentIndex(0)  # +
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("4 + 6i", text)

    def test_roots_ui(self):
        page = ComplexPage()
        page.mode_combo.setCurrentIndex(2)
        page.pr_z.setText("1 + i")
        page.pr_root_n.setText("3")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("3-th COMPLEX ROOTS", text)
        self.assertIn("Root k = 0", text)

    def test_rlc_ui(self):
        page = ComplexPage()
        page.mode_combo.setCurrentIndex(3)
        page.rlc_r.setText("10")
        page.rlc_l.setText("0.05")
        page.rlc_c.setText("0.0001")
        page.rlc_f.setText("60")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Total Impedance Z", text)
        self.assertIn("Resonance Frequency", text)


if __name__ == "__main__":
    unittest.main()
