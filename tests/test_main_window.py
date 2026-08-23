import unittest
from unittest.mock import MagicMock, patch


class TestMainWindowActions(unittest.TestCase):
    def test_copy_result_none_widget(self):
        with patch.dict("sys.modules", {"PySide6.QtWidgets": MagicMock(), "PySide6.QtCore": MagicMock(), "PySide6.QtGui": MagicMock()}):
            from ui.main_window import MainWindow
            window = MagicMock(spec=MainWindow)
            window.stack = MagicMock()
            window.stack.currentWidget.return_value = None
            MainWindow._copy_result(window)
            window.stack.currentWidget.assert_called_once()

    def test_paste_input_none_widget(self):
        with patch.dict("sys.modules", {"PySide6.QtWidgets": MagicMock(), "PySide6.QtCore": MagicMock(), "PySide6.QtGui": MagicMock()}):
            from ui.main_window import MainWindow
            window = MagicMock(spec=MainWindow)
            window.stack = MagicMock()
            window.stack.currentWidget.return_value = None
            MainWindow._paste_input(window)
            window.stack.currentWidget.assert_called_once()

    def test_clear_current_page_none_widget(self):
        with patch.dict("sys.modules", {"PySide6.QtWidgets": MagicMock(), "PySide6.QtCore": MagicMock(), "PySide6.QtGui": MagicMock()}):
            from ui.main_window import MainWindow
            window = MagicMock(spec=MainWindow)
            window.stack = MagicMock()
            window.stack.currentWidget.return_value = None
            MainWindow._clear_current_page(window)
            window.stack.currentWidget.assert_called_once()


if __name__ == "__main__":
    unittest.main()
