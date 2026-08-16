import unittest
from unittest.mock import MagicMock, patch


class TestFluentTheme(unittest.TestCase):
    def setUp(self):
        self.mock_app = MagicMock()

    def test_init_default_theme(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        self.assertEqual(theme.theme_name, "dark")

    def test_apply_dark(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        theme.apply("dark")
        self.assertEqual(theme.theme_name, "dark")
        self.assertIn("#1e1e24", theme.get("bg_primary"))

    def test_apply_light(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        theme.apply("light")
        self.assertEqual(theme.theme_name, "light")
        self.assertIn("#f4f6f9", theme.get("bg_primary"))

    def test_get_with_default(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        result = theme.get("nonexistent", "fallback")
        self.assertEqual(result, "fallback")

    def test_get_existing(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        result = theme.get("accent")
        self.assertEqual(result, "#00ffaa")

    def test_apply_calls_set_stylesheet(self):
        from ui.fluent_theme import FluentTheme
        theme = FluentTheme(self.mock_app)
        theme.apply("dark")
        self.mock_app.setStyleSheet.assert_called_once()
        self.mock_app.setPalette.assert_called_once()

    @patch("ui.fluent_theme.FluentTheme")
    def test_apply_theme_function(self, MockTheme):
        from ui.fluent_theme import apply_theme
        apply_theme(self.mock_app, "light")
        MockTheme.return_value.apply.assert_called_once_with("light")
