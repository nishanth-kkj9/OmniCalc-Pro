import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

try:
    from PySide6.QtWidgets import QApplication
    from PySide6.QtCore import Qt
    from PySide6.QtGui import QKeyEvent
    from ui.scientific_page import ScientificPage, format_sci_result, toggle_sign
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False

if PYSIDE_AVAILABLE:
    app = QApplication.instance() or QApplication([sys.argv[0], "-platform", "offscreen"])


@unittest.skipUnless(PYSIDE_AVAILABLE, "PySide6 not available in this environment")
class TestScientificPageUnit(unittest.TestCase):
    def test_format_sci_result(self):
        self.assertEqual(format_sci_result(5.0), "5")
        self.assertEqual(format_sci_result(2.5), "2.5")
        self.assertEqual(format_sci_result(0.0), "0")
        self.assertEqual(format_sci_result(-0.0), "0")
        self.assertEqual(format_sci_result(42), "42")
        self.assertEqual(format_sci_result("Error"), "Error")

    def test_toggle_sign(self):
        self.assertEqual(toggle_sign("")[0], "-")
        self.assertEqual(toggle_sign("-")[0], "")
        self.assertEqual(toggle_sign("5")[0], "-5")
        self.assertEqual(toggle_sign("-5")[0], "5")
        self.assertEqual(toggle_sign("12+5")[0], "12+(-5)")
        self.assertEqual(toggle_sign("12+(-5)")[0], "12+5")
        self.assertEqual(toggle_sign("12+")[0], "12+(-")
        self.assertEqual(toggle_sign("12+(-")[0], "12+")
        self.assertEqual(toggle_sign("12", is_evaluated=True, current_result="12")[0], "-12")
        self.assertEqual(toggle_sign("-12", is_evaluated=True, current_result="-12")[0], "12")


@unittest.skipUnless(PYSIDE_AVAILABLE, "PySide6 not available in this environment")
class TestScientificPageUI(unittest.TestCase):
    def setUp(self):
        self.page = ScientificPage(config={"angle_mode": "degrees"})

    def tearDown(self):
        self.page.close()
        self.page.deleteLater()

    def test_initial_state(self):
        self.assertEqual(self.page.display.text(), "")
        self.assertEqual(self.page.expression, "")
        self.assertFalse(self.page.is_evaluated)
        self.assertFalse(self.page.is_2nd)
        self.assertFalse(self.page.is_hyp)
        self.assertTrue(self.page.mem_label.isHidden())
        self.assertEqual(self.page.mode_badge.text(), "DEG")

    def test_calculate_basic_arithmetic(self):
        self.page._input("1")
        self.page._input("5")
        self.page._input("+")
        self.page._input("2")
        self.page._input("7")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "42")
        self.assertTrue(self.page.is_evaluated)

    def test_calculate_trigonometry_degrees(self):
        # sin(30) = 0.5
        self.page._input("sin(")
        self.page._input("3")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "0.5")

    def test_calculate_trigonometry_radians(self):
        # Switch mode to RAD (index 1)
        self.page.mode_combo.setCurrentIndex(1)
        self.assertEqual(self.page.mode_badge.text(), "RAD")
        # cos(0) = 1
        self.page._input("cos(")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "1")

    def test_calculate_trigonometry_gradians(self):
        # Switch mode to GRAD (index 2)
        self.page.mode_combo.setCurrentIndex(2)
        self.assertEqual(self.page.mode_badge.text(), "GRAD")
        # sin(100) = 1
        self.page._input("sin(")
        self.page._input("1")
        self.page._input("0")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "1")

    def test_2nd_mode_toggle_and_functions(self):
        self.page._toggle_2nd()
        self.assertTrue(self.page.is_2nd)
        self.assertEqual(self.page.btn_sin.text(), "sin⁻¹")
        self.assertEqual(self.page.btn_fact.text(), "nCr")
        self.assertEqual(self.page.btn_ln.text(), "eˣ")
        self.assertEqual(self.page.btn_log.text(), "10ˣ")
        self.assertEqual(self.page.btn_pow.text(), "x²")
        self.assertEqual(self.page.btn_root.text(), "∛")
        self.assertEqual(self.page.btn_inv.text(), "|x|")
        self.assertEqual(self.page.btn_pi.text(), "τ")
        self.assertEqual(self.page.btn_e.text(), "2ˣ")
        self.assertEqual(self.page.btn_mod.text(), "nPr")
        self.assertEqual(self.page.btn_sign.text(), ",")

        # Calculate asin(0.5) in DEG = 30
        self.page._input_sin()
        self.assertEqual(self.page.expression, "asin(")
        self.page._input("0")
        self.page._input(".")
        self.page._input("5")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "30")

    def test_hyp_mode_and_hyperbolics(self):
        self.page._toggle_hyp()
        self.assertTrue(self.page.is_hyp)
        self.assertEqual(self.page.btn_sin.text(), "sinh")
        self.assertEqual(self.page.btn_cos.text(), "cosh")
        self.assertEqual(self.page.btn_tan.text(), "tanh")

        # sinh(0) = 0
        self.page._input_sin()
        self.assertEqual(self.page.expression, "sinh(")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "0")

    def test_2nd_and_hyp_combined(self):
        self.page._toggle_2nd()
        self.page._toggle_hyp()
        self.assertTrue(self.page.is_2nd)
        self.assertTrue(self.page.is_hyp)
        self.assertEqual(self.page.btn_sin.text(), "sinh⁻¹")
        self.assertEqual(self.page.btn_cos.text(), "cosh⁻¹")
        self.assertEqual(self.page.btn_tan.text(), "tanh⁻¹")

        # asinh(0) = 0
        self.page._input_sin()
        self.assertEqual(self.page.expression, "asinh(")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "0")

    def test_calculate_log_and_ln(self):
        # log(100) = 2
        self.page._input("log(")
        self.page._input("1")
        self.page._input("0")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "2")

    def test_calculate_sqrt_and_cbrt(self):
        # sqrt(81) = 9
        self.page._input("sqrt(")
        self.page._input("8")
        self.page._input("1")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "9")

        # cbrt(64) = 4
        self.page._input("C")
        self.page._input("cbrt(")
        self.page._input("6")
        self.page._input("4")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "4")

    def test_calculate_factorial_and_combinatorics(self):
        # 5! = 120
        self.page._input("5")
        self.page._input("!")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "120")

        # ncr(5, 2) = 10
        self.page._input("C")
        self.page._toggle_2nd()
        self.page.btn_fact.click()
        self.assertEqual(self.page.expression, "ncr(")
        self.page._input("5")
        self.page._input(",")
        self.page._input("2")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "10")

    def test_memory_operations(self):
        self.page._input("4")
        self.page._input("2")
        self.page._handle_memory("M+")
        self.assertEqual(self.page.memory, 42.0)
        self.assertFalse(self.page.mem_label.isHidden())
        self.assertIn("M: 42", self.page.mem_label.text())

        self.page._input("C")
        self.assertEqual(self.page.display.text(), "")

        self.page._handle_memory("MR")
        self.assertEqual(self.page.display.text(), "42")

        self.page._input("C")
        self.page._input("1")
        self.page._input("2")
        self.page._handle_memory("M-")
        self.assertEqual(self.page.memory, 30.0)

        self.page._handle_memory("MC")
        self.assertEqual(self.page.memory, 0.0)
        self.assertTrue(self.page.mem_label.isHidden())

    def test_undo_functionality(self):
        self.page._input("9")
        self.page._input("+")
        self.page._input("3")
        self.assertEqual(self.page.display.text(), "9+3")

        self.page._undo()
        self.assertEqual(self.page.display.text(), "9+")

        self.page._undo()
        self.assertEqual(self.page.display.text(), "9")

    def test_backspace_function_token(self):
        self.page._input("sin(")
        self.assertEqual(self.page.display.text(), "sin(")
        self.page._input("BACKSPACE")
        self.assertEqual(self.page.display.text(), "")

    def test_sign_toggle(self):
        self.page._input("8")
        self.page._input("SIGN")
        self.assertEqual(self.page.display.text(), "-8")
        self.page._input("SIGN")
        self.assertEqual(self.page.display.text(), "8")

    def test_ans_token_substitution(self):
        self.page._input("1")
        self.page._input("0")
        self.page._input("+")
        self.page._input("5")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "15")

        # Use Ans in next calculation: Ans * 2 = 30
        self.page._input("Ans")
        self.page._input("*")
        self.page._input("2")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "30")

    def test_calculate_npr_and_modulo(self):
        # 8 mod 3 = 2
        self.page._input("8")
        self.page._input(" mod ")
        self.page._input("3")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "2")

        # npr(5, 2) = 20
        self.page._input("C")
        self.page._toggle_2nd()
        self.page.btn_mod.click()
        self.assertEqual(self.page.expression, "npr(")
        self.page._input("5")
        self.page._input(",")
        self.page._input("2")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "20")

    def test_auto_close_parentheses(self):
        # sin(30 without closing paren -> auto-closes to sin(30) = 0.5
        self.page._input("sin(")
        self.page._input("3")
        self.page._input("0")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "0.5")

    def test_trig_zero_crossing_exact(self):
        # cos(90) = 0 in DEG
        self.page._input("cos(")
        self.page._input("9")
        self.page._input("0")
        self.page._input(")")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "0")

    def test_error_handling(self):
        self.page._input("1")
        self.page._input("/")
        self.page._input("0")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "Error")
