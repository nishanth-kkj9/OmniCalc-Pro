import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

from PySide6.QtWidgets import QApplication

app = QApplication.instance() or QApplication(sys.argv)

from ui.geometry_page import GeometryPage


class TestGeometryPage(unittest.TestCase):
    def test_triangle_ui(self):
        page = GeometryPage()
        page.mode_combo.setCurrentIndex(0)  # Triangle
        page.tri_type.setCurrentIndex(0)  # SSS
        page.tri_a.setText("5")
        page.tri_b.setText("6")
        page.tri_c_or_A.setText("7")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("14.6969", text)

    def test_2d_shape_ui(self):
        page = GeometryPage()
        page.mode_combo.setCurrentIndex(1)
        page.s2d_type.setCurrentText("circle")
        page.s2d_p1.setText("5")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("78.5398", text)

    def test_3d_shape_ui(self):
        page = GeometryPage()
        page.mode_combo.setCurrentIndex(2)
        page.s3d_type.setCurrentText("sphere")
        page.s3d_p1.setText("3")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("113.097", text)

    def test_line_ui(self):
        page = GeometryPage()
        page.mode_combo.setCurrentIndex(3)
        page.line_x1.setText("1")
        page.line_y1.setText("2")
        page.line_x2.setText("5")
        page.line_y2.setText("8")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("y = 1.5x + 0.5", text)

    def test_vector_ui(self):
        page = GeometryPage()
        page.mode_combo.setCurrentIndex(4)
        page.vec_dim.setCurrentIndex(1)  # 3D
        page.vec_ux.setText("2")
        page.vec_uy.setText("3")
        page.vec_uz.setText("-1")
        page.vec_vx.setText("4")
        page.vec_vy.setText("0")
        page.vec_vz.setText("5")
        page.calculate()
        text = page.output.toPlainText()
        self.assertIn("Cross Product u×v:   (15, -14, -12)", text)


if __name__ == "__main__":
    unittest.main()
