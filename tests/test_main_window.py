import unittest
from unittest.mock import MagicMock

# Import the real module directly. PySide6 already imports headlessly under
# QT_QPA_PLATFORM=offscreen (see tests/conftest.py), so there is no need to
# replace PySide6.QtWidgets/QtCore/QtGui with MagicMock() in sys.modules here.
# Doing so previously broke this test: `class MainWindow(QMainWindow):` was
# built against a mocked QMainWindow (itself an auto-generated MagicMock
# attribute), and subclassing a raw MagicMock instance does not produce a
# real class - MainWindow silently became a MagicMock, so calling its
# private methods raised AttributeError instead of exercising the real
# None-widget guard clauses these tests are meant to check.
from ui.main_window import MainWindow


class TestMainWindowActions(unittest.TestCase):
    def test_copy_result_none_widget(self):
        window = MagicMock()
        window.stack = MagicMock()
        window.stack.currentWidget.return_value = None
        MainWindow._copy_result(window)
        window.stack.currentWidget.assert_called_once()

    def test_paste_input_none_widget(self):
        window = MagicMock()
        window.stack = MagicMock()
        window.stack.currentWidget.return_value = None
        MainWindow._paste_input(window)
        window.stack.currentWidget.assert_called_once()

    def test_clear_current_page_none_widget(self):
        window = MagicMock()
        window.stack = MagicMock()
        window.stack.currentWidget.return_value = None
        MainWindow._clear_current_page(window)
        window.stack.currentWidget.assert_called_once()


if __name__ == "__main__":
    unittest.main()
