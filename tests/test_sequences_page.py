import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.sequences_page import SequencesPage
from core.sequences_engine import SequencesEngine


class TestSequencesPage(unittest.TestCase):
    def test_arithmetic_ui(self):
        page = SequencesPage()
        page.mode_combo.setCurrentIndex(0)
        page.arith_a1.setText("1")
        page.arith_d.setText("3")
        page.arith_n.setText("10")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Arithmetic sequence with common difference d = 3", text)
        self.assertEqual(page.table.rowCount(), 10)

    def test_geometric_ui(self):
        page = SequencesPage()
        page.mode_combo.setCurrentIndex(1)
        page.geom_a1.setText("1")
        page.geom_r.setText("0.5")
        page.geom_n.setText("10")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Infinite Series converges to S_∞ = a1 / (1 - r) = 2", text)

    def test_fibonacci_ui(self):
        page = SequencesPage()
        page.mode_combo.setCurrentIndex(2)
        page.fib_n.setText("8")
        page.calculate()
        self.assertEqual(page.table.item(7, 1).text(), "21")

    def test_harmonic_ui(self):
        page = SequencesPage()
        page.mode_combo.setCurrentIndex(3)
        page.harm_a.setText("1")
        page.harm_d.setText("1")
        page.harm_n.setText("5")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("diverges logarithmically", text)

    def test_explicit_ui(self):
        page = SequencesPage()
        page.mode_combo.setCurrentIndex(4)
        page.exp_expr.setText("n**2")
        page.exp_n.setText("5")
        page.calculate()
        self.assertEqual(page.table.item(4, 1).text(), "25")


if __name__ == "__main__":
    unittest.main()
