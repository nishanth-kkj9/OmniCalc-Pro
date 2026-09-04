import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.physical_units_page import PhysicalUnitsPage


class TestPhysicalUnitsPage(unittest.TestCase):
    def test_converter_ui(self):
        page = PhysicalUnitsPage()
        page.mode_combo.setCurrentIndex(0)
        page.conv_val.setText("100")
        page.conv_from.setCurrentText("km")
        page.conv_to.setCurrentText("mi")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("62.1371", text)

    def test_compound_ui(self):
        page = PhysicalUnitsPage()
        page.mode_combo.setCurrentIndex(1)
        page.comp_v1.setText("50")
        page.comp_u1.setCurrentText("N")
        page.comp_op.setCurrentIndex(0)  # *
        page.comp_v2.setText("10")
        page.comp_u2.setCurrentText("m")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Energy / Work", text)
        self.assertIn("500", text)

    def test_formula_ui(self):
        page = PhysicalUnitsPage()
        page.mode_combo.setCurrentIndex(3)
        page.form_combo.setCurrentIndex(0)  # F = ma
        page.form_p1.setText("10")
        page.form_p2.setText("9.80665")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("98.0665 N", text)


if __name__ == "__main__":
    unittest.main()
