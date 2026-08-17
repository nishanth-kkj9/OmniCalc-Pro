import unittest
import sys
from unittest.mock import patch, MagicMock
from PySide6.QtWidgets import QApplication
import ui.icon_loader


class TestIconLoader(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if QApplication.instance() is None:
            cls.app = QApplication([sys.argv[0] if sys.argv else "pytest", "-platform", "offscreen"])

    def setUp(self):
        ui.icon_loader.clear_icon_cache()

    def tearDown(self):
        ui.icon_loader.clear_icon_cache()

    @patch("ui.icon_loader.os.path.exists", return_value=False)
    def test_load_svg_icon_missing(self, mock_exists):
        from ui.icon_loader import load_svg_icon
        icon = load_svg_icon("nonexistent")
        self.assertTrue(icon.isNull())

    @patch("ui.icon_loader.os.path.exists", return_value=True)
    @patch("ui.icon_loader.QSvgRenderer")
    def test_load_svg_icon_success(self, MockRenderer, mock_exists):
        from ui.icon_loader import load_svg_icon
        icon = load_svg_icon("dashboard")
        self.assertFalse(icon.isNull())

    def test_get_sidebar_icons(self):
        from ui.icon_loader import get_sidebar_icons
        icons = get_sidebar_icons()
        self.assertIn("Dashboard", icons)
        self.assertIn("Settings", icons)
        self.assertEqual(len(icons), 11)

    def test_get_toolbar_icons(self):
        from ui.icon_loader import get_toolbar_icons
        icons = get_toolbar_icons()
        self.assertIn("minimize", icons)
        self.assertIn("close", icons)

    def test_clear_icon_cache(self):
        from ui.icon_loader import clear_icon_cache
        clear_icon_cache()
