import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

try:
    from PySide6.QtWidgets import QApplication
    from PySide6.QtCore import Qt
    from PySide6.QtGui import QKeyEvent
    from ui.basic_page import BasicPage, format_result, toggle_sign
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False

if PYSIDE_AVAILABLE:
    app = QApplication.instance() or QApplication([sys.argv[0], "-platform", "offscreen"])


class TestBasicPageUnit(unittest.TestCase):
    def test_format_result(self):
        self.assertEqual(format_result(5.0), "5")
        self.assertEqual(format_result(2.5), "2.5")
        self.assertEqual(format_result(0.0), "0")
        self.assertEqual(format_result(-0.0), "0")
        self.assertEqual(format_result(42), "42")
        self.assertEqual(format_result("Error"), "Error")

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
class TestBasicPageUI(unittest.TestCase):
    def setUp(self):
        self.page = BasicPage(config={"angle_mode": "degrees"})

    def tearDown(self):
        self.page.close()
        self.page.deleteLater()

    def test_initial_state(self):
        self.assertEqual(self.page.display.text(), "0")
        self.assertEqual(self.page.expression, "")
        self.assertFalse(self.page.is_evaluated)
        self.assertEqual(self.page.clear_btn.text(), "AC")
        self.assertFalse(self.page.mem_label.isVisible())
        self.assertFalse(self.page.undo_btn.isEnabled())

    def test_keypad_input_and_clear_toggle(self):
        self.page._input("7")
        self.assertEqual(self.page.display.text(), "7")
        self.assertEqual(self.page.clear_btn.text(), "C")

        self.page._input("+")
        self.page._input("5")
        self.assertEqual(self.page.display.text(), "7+5")

        self.page._input("C")
        self.assertEqual(self.page.display.text(), "0")
        self.assertEqual(self.page.expression, "")
        self.assertEqual(self.page.clear_btn.text(), "AC")

    def test_calculate_addition(self):
        self.page._input("7")
        self.page._input("+")
        self.page._input("5")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "12")
        self.assertTrue(self.page.is_evaluated)
        self.assertEqual(self.page.expr_label.text(), "7+5 =")

    def test_post_result_digit_starts_fresh(self):
        self.page._input("8")
        self.page._input("+")
        self.page._input("2")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "10")
        self.assertTrue(self.page.is_evaluated)

        # Entering a digit starts fresh
        self.page._input("3")
        self.assertEqual(self.page.display.text(), "3")
        self.assertEqual(self.page.expression, "3")
        self.assertFalse(self.page.is_evaluated)

    def test_post_result_operator_chains(self):
        self.page._input("8")
        self.page._input("+")
        self.page._input("2")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "10")

        # Entering an operator continues calculation
        self.page._input("×")
        self.assertEqual(self.page.display.text(), "10\u00d7")
        self.assertEqual(self.page.expression, "10\u00d7")
        self.assertFalse(self.page.is_evaluated)

    def test_backspace(self):
        self.page._input("1")
        self.page._input("2")
        self.page._input("3")
        self.assertEqual(self.page.display.text(), "123")

        self.page._input("\u232b")
        self.assertEqual(self.page.display.text(), "12")

        self.page._input("\u232b")
        self.page._input("\u232b")
        self.assertEqual(self.page.display.text(), "0")

    def test_backspace_after_evaluated_clears(self):
        self.page._input("6")
        self.page._input("×")
        self.page._input("7")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "42")

        self.page._input("\u232b")
        self.assertEqual(self.page.display.text(), "0")
        self.assertEqual(self.page.expression, "")
        self.assertFalse(self.page.is_evaluated)

    def test_undo_functionality(self):
        self.page._input("9")
        self.page._input("+")
        self.assertEqual(self.page.display.text(), "9+")
        self.assertTrue(self.page.undo_btn.isEnabled())

        self.page.handle_undo()
        self.assertEqual(self.page.display.text(), "9")

    def test_memory_operations(self):
        self.page._input("5")
        self.page._input("M+")
        self.assertEqual(self.page.memory, 5.0)
        self.assertTrue(self.page.mem_label.isVisible())
        self.assertIn("M = 5", self.page.mem_label.text())

        self.page._input("C")
        self.assertEqual(self.page.display.text(), "0")

        self.page._input("MR")
        self.assertEqual(self.page.display.text(), "5")

        self.page._input("2")
        self.page._input("M-")
        self.assertEqual(self.page.memory, 3.0)

        self.page._input("MC")
        self.assertEqual(self.page.memory, 0.0)
        self.assertFalse(self.page.mem_label.isVisible())

    def test_operator_replacement(self):
        self.page._input("5")
        self.page._input("+")
        self.assertEqual(self.page.expression, "5+")

        # Typing multiply replaces plus
        self.page._input("×")
        self.assertEqual(self.page.expression, "5\u00d7")

    def test_decimal_prevention(self):
        self.page._input("5")
        self.page._input(".")
        self.page._input("2")
        self.page._input(".")  # Redundant decimal ignored
        self.assertEqual(self.page.expression, "5.2")

    def test_error_handling(self):
        self.page._input("5")
        self.page._input("÷")
        self.page._input("0")
        self.page._input("=")
        self.assertEqual(self.page.display.text(), "Error")
        self.assertTrue(self.page.is_evaluated)

        # Typing a digit after error replaces it
        self.page._input("9")
        self.assertEqual(self.page.display.text(), "9")
        self.assertFalse(self.page.is_evaluated)

    def test_keyboard_events(self):
        event_num = QKeyEvent(QKeyEvent.Type.KeyPress, Qt.Key.Key_8, Qt.KeyboardModifier.NoModifier, "8")
        self.page.keyPressEvent(event_num)
        self.assertEqual(self.page.display.text(), "8")

        event_add = QKeyEvent(QKeyEvent.Type.KeyPress, Qt.Key.Key_Plus, Qt.KeyboardModifier.NoModifier, "+")
        self.page.keyPressEvent(event_add)
        self.assertEqual(self.page.display.text(), "8+")

        event_num2 = QKeyEvent(QKeyEvent.Type.KeyPress, Qt.Key.Key_4, Qt.KeyboardModifier.NoModifier, "4")
        self.page.keyPressEvent(event_num2)
        self.assertEqual(self.page.display.text(), "8+4")

        event_eq = QKeyEvent(QKeyEvent.Type.KeyPress, Qt.Key.Key_Return, Qt.KeyboardModifier.NoModifier)
        self.page.keyPressEvent(event_eq)
        self.assertEqual(self.page.display.text(), "12")

        event_esc = QKeyEvent(QKeyEvent.Type.KeyPress, Qt.Key.Key_Escape, Qt.KeyboardModifier.NoModifier)
        self.page.keyPressEvent(event_esc)
        self.assertEqual(self.page.display.text(), "0")

    def test_lifecycle_creation_destruction(self):
        for _ in range(5):
            p = BasicPage()
            self.assertIsNotNone(p.display)
            p.close()
            p.deleteLater()
