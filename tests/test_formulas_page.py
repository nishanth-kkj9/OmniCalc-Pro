"""
Unit, UI, and integration tests for Formulas & Reference Library.
Covers:
1. Pure domain FormulasEngine:
   - Database integrity: 59 curated items, unique IDs, category validity
   - Required and optional fields verification
   - Category filtering across all categories
   - Web-equivalent search semantics (name, symbol, formula, description, numericValue, relatedModes)
   - Combined category + search filtering and no-results behavior
2. Desktop FormulasPage UI:
   - Initialization and widget construction for all 59 items
   - Category button pill selection and QComboBox synchronization
   - Search text input filtering and count label updates
   - No-results empty state visibility and clear button action
   - Copy buttons for formulas and numeric values
   - Related mode navigation callbacks
   - Common controller calculate() and clear_expression() interfaces
   - Cleanup lifecycle stability and signal disconnection
3. Desktop & Registry Integration:
   - Sidebar registration, icon alignment, and length matching
   - MainWindow page_factories registration and lazy instantiation
"""
import unittest
import os
import sys

os.environ["QT_QPA_PLATFORM"] = "offscreen"

try:
    from PySide6.QtWidgets import QApplication
    app = QApplication.instance() or QApplication(sys.argv)
    from ui.formulas_page import FormulasPage, CALC_MODE_TO_PAGE_NAME
    from ui.main_window import MainWindow, get_default_page_factories
    from ui.sidebar import PAGE_NAMES, SIDE_ICONS
    HAS_PYSIDE6 = True
except ImportError:
    HAS_PYSIDE6 = False
    FormulasPage = None  # type: ignore
    MainWindow = None  # type: ignore
    get_default_page_factories = None  # type: ignore
    PAGE_NAMES = []  # type: ignore
    SIDE_ICONS = []  # type: ignore
    CALC_MODE_TO_PAGE_NAME = {}  # type: ignore

from core.formulas_engine import (
    FormulasEngine,
    FormulaConstantItem,
    CATEGORIES,
    FORMULAS_AND_CONSTANTS_DATABASE,
)


class TestFormulasEngine(unittest.TestCase):
    """Pure domain logic and data integrity tests for FormulasEngine."""

    def test_database_length_and_non_empty(self):
        self.assertEqual(len(FORMULAS_AND_CONSTANTS_DATABASE), 59)
        all_items = FormulasEngine.get_all_items()
        self.assertEqual(len(all_items), 59)

    def test_database_unique_ids(self):
        ids = [item.id for item in FORMULAS_AND_CONSTANTS_DATABASE]
        self.assertEqual(len(ids), len(set(ids)), "Duplicate item IDs found in database")

    def test_categories_list(self):
        cats = FormulasEngine.get_categories()
        expected = [
            "All",
            "Constants",
            "Calculus",
            "Algebra",
            "Geometry & Trig",
            "Matrix & Vectors",
            "Statistics",
            "Computer Science",
            "Finance",
            "Health & Bio",
            "Unit Factors",
        ]
        self.assertEqual(cats, expected)

    def test_category_filtering_counts(self):
        expected_counts = {
            "All": 59,
            "Constants": 15,
            "Calculus": 9,
            "Algebra": 5,
            "Geometry & Trig": 6,
            "Matrix & Vectors": 4,
            "Statistics": 5,
            "Computer Science": 4,
            "Finance": 4,
            "Health & Bio": 3,
            "Unit Factors": 4,
        }
        for cat, expected_count in expected_counts.items():
            filtered = FormulasEngine.filter_items(category=cat, search="")
            self.assertEqual(
                len(filtered),
                expected_count,
                f"Mismatch in item count for category '{cat}': expected {expected_count}, got {len(filtered)}"
            )

    def test_search_by_name(self):
        results = FormulasEngine.filter_items(category="All", search="Archimedes")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, "const_pi")

    def test_search_by_symbol(self):
        results = FormulasEngine.filter_items(category="All", search="π")
        self.assertTrue(any(it.id == "const_pi" for it in results))

        results_phi = FormulasEngine.filter_items(category="All", search="φ")
        self.assertTrue(any(it.id == "const_phi" for it in results_phi))

    def test_search_by_formula(self):
        results = FormulasEngine.filter_items(category="All", search="a² + b² = c²")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, "geo_pythagoras")

    def test_search_by_description(self):
        results = FormulasEngine.filter_items(category="All", search="gravitation")
        self.assertTrue(any(it.id == "const_G_big" for it in results))

    def test_search_by_numeric_value(self):
        # Speed of light in vacuum: 299792458
        results = FormulasEngine.filter_items(category="All", search="299792458")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, "const_c")

    def test_search_by_related_mode(self):
        results = FormulasEngine.filter_items(category="All", search="geometry")
        self.assertGreaterEqual(len(results), 6)
        for it in results:
            self.assertTrue(
                "geometry" in [m.lower() for m in it.related_modes]
                or "geometry" in it.name.lower()
                or "geometry" in it.description.lower()
                or "geometry" in it.category.lower()
            )

    def test_search_trim_and_case_insensitivity(self):
        res_upper = FormulasEngine.filter_items(category="All", search="  EULER  ")
        res_lower = FormulasEngine.filter_items(category="All", search="euler")
        self.assertEqual(len(res_upper), len(res_lower))
        self.assertTrue(len(res_upper) > 0)

    def test_no_results_search(self):
        results = FormulasEngine.filter_items(category="All", search="completely_unmatched_query_xyz")
        self.assertEqual(len(results), 0)

    def test_combined_category_and_search(self):
        # Search "derivative" in Calculus
        calc_deriv = FormulasEngine.filter_items(category="Calculus", search="derivative")
        self.assertGreaterEqual(len(calc_deriv), 1)
        for it in calc_deriv:
            self.assertEqual(it.category, "Calculus")

        # Search "derivative" in Finance -> 0 results
        fin_deriv = FormulasEngine.filter_items(category="Finance", search="derivative")
        self.assertEqual(len(fin_deriv), 0)

    def test_get_item_by_id(self):
        item = FormulasEngine.get_item_by_id("const_pi")
        self.assertIsNotNone(item)
        assert item is not None
        self.assertEqual(item.name, "Pi (Archimedes Constant)")
        self.assertEqual(item.symbol, "π")
        self.assertEqual(item.relatedModes, item.related_modes)
        self.assertEqual(item.numericValue, item.numeric_value)

        non_item = FormulasEngine.get_item_by_id("non_existent_id")
        self.assertIsNone(non_item)

    def test_field_integrity(self):
        for item in FORMULAS_AND_CONSTANTS_DATABASE:
            self.assertTrue(bool(item.id))
            self.assertTrue(bool(item.name))
            self.assertTrue(bool(item.formula))
            self.assertTrue(bool(item.description))
            self.assertIn(item.category, CATEGORIES)
            self.assertIsInstance(item.related_modes, list)
            self.assertGreater(len(item.related_modes), 0)


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestFormulasPageUI(unittest.TestCase):
    """UI controls, filtering, interaction, and lifecycle tests."""

    def setUp(self):
        self.navigated_mode = None

        def mock_navigate(mode: str) -> None:
            self.navigated_mode = mode

        self.page = FormulasPage(on_navigate_mode=mock_navigate)

    def tearDown(self):
        if hasattr(self, "page") and self.page is not None:
            self.page.cleanup()
            self.page.deleteLater()
            self.page = None
        if app is not None:
            app.processEvents()

    def test_initialization(self):
        self.assertEqual(len(self.page.all_items), 59)
        self.assertEqual(len(self.page.card_widgets), 59)
        self.assertEqual(self.page.selected_category, "All")
        self.assertEqual(self.page.search_text, "")
        self.assertIn("Showing 59 of 59", self.page.count_label.text())
        self.assertTrue(self.page.no_results_widget.isHidden())
        self.assertTrue(all(not card.isHidden() for card in self.page.card_widgets.values()))

    def test_category_button_filtering(self):
        self.page.set_category("Calculus")
        self.assertEqual(self.page.selected_category, "Calculus")
        self.assertEqual(self.page.cat_combo.currentText(), "Calculus")
        self.assertIn("Showing 9 of 59", self.page.count_label.text())

        # Check explicit card visibility state
        visible_cards = [card for card in self.page.card_widgets.values() if not card.isHidden()]
        self.assertEqual(len(visible_cards), 9)

        calc_items = FormulasEngine.filter_items(category="Calculus", search="")
        self.assertEqual(len(calc_items), 9)
        for it in calc_items:
            self.assertFalse(self.page.card_widgets[it.id].isHidden())

    def test_category_combo_filtering(self):
        self.page.cat_combo.setCurrentText("Finance")
        self.assertEqual(self.page.selected_category, "Finance")
        self.assertIn("Showing 4 of 59", self.page.count_label.text())
        visible_cards = [card for card in self.page.card_widgets.values() if not card.isHidden()]
        self.assertEqual(len(visible_cards), 4)

    def test_search_input_filtering(self):
        # Database contains two Pythagorean entries (geo_pythagoras & geo_trig_identity)
        self.page.search_input.setText("Pythagorean")
        self.assertIn("Showing 2 of 59", self.page.count_label.text())
        matching_cards = [card for card in self.page.card_widgets.values() if not card.isHidden()]
        self.assertEqual(len(matching_cards), 2)
        self.assertFalse(self.page.card_widgets["geo_pythagoras"].isHidden())
        self.assertFalse(self.page.card_widgets["geo_trig_identity"].isHidden())

        # Test single unique match
        self.page.search_input.setText("Archimedes")
        self.assertIn("Showing 1 of 59", self.page.count_label.text())
        single_match = [card for card in self.page.card_widgets.values() if not card.isHidden()]
        self.assertEqual(len(single_match), 1)
        self.assertFalse(self.page.card_widgets["const_pi"].isHidden())

    def test_no_results_and_clear_action(self):
        self.page.search_input.setText("unmatched_keyword_999")
        self.assertFalse(self.page.no_results_widget.isHidden())
        self.assertIn("Showing 0 of 59", self.page.count_label.text())
        self.assertTrue(all(card.isHidden() for card in self.page.card_widgets.values()))

        # Test clear expression
        self.page.clear_expression()
        self.assertEqual(self.page.search_input.text(), "")
        self.assertEqual(self.page.selected_category, "All")
        self.assertTrue(self.page.no_results_widget.isHidden())
        self.assertIn("Showing 59 of 59", self.page.count_label.text())
        self.assertTrue(all(not card.isHidden() for card in self.page.card_widgets.values()))

    def test_copy_text_helper(self):
        test_btn = self.page.cat_buttons["All"]
        orig_text = test_btn.text()
        self.page.copy_text("test_clipboard_content", test_btn, orig_text)
        self.assertEqual(test_btn.text(), "✓ Copied")

    def test_navigate_to_mode(self):
        success = self.page.navigate_to_mode("geometry")
        self.assertTrue(success)
        self.assertEqual(self.navigated_mode, "geometry")

    def test_calculate_interface(self):
        self.page.calculate()
        self.assertIn("Showing 59 of 59", self.page.count_label.text())

    def test_repeated_lifecycle(self):
        for _ in range(3):
            p = FormulasPage()
            p.cleanup()
            p.deleteLater()
        if app is not None:
            app.processEvents()


class TestFormulasStaticRegistration(unittest.TestCase):
    """Static registration and code alignment checks that run without GUI dependencies."""

    def test_sidebar_source_registration(self):
        with open("ui/sidebar.py", "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('"Formulas"', content)
        self.assertIn('"\\U0001f4d6"', content)

    def test_mainwindow_factory_source_registration(self):
        with open("ui/main_window.py", "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('"Formulas"', content)
        self.assertIn('"ui.formulas_page"', content)
        self.assertIn('"FormulasPage"', content)


@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed in test environment")
class TestFormulasIntegration(unittest.TestCase):
    """Integration checks with MainWindow, Sidebar, and Registry."""

    def test_sidebar_contains_formulas(self):
        self.assertIn("Formulas", PAGE_NAMES)
        idx = PAGE_NAMES.index("Formulas")
        self.assertEqual(len(PAGE_NAMES), len(SIDE_ICONS))
        self.assertEqual(SIDE_ICONS[idx], "\U0001f4d6")

    def test_mainwindow_factory_registration(self):
        factories = get_default_page_factories()
        names = [f[0] for f in factories]
        self.assertIn("Formulas", names)
        f_idx = names.index("Formulas")

        # Instantiate page via lazy factory
        f_page = factories[f_idx][1]()
        self.assertIsInstance(f_page, FormulasPage)
        if hasattr(f_page, "cleanup"):
            f_page.cleanup()
        f_page.deleteLater()
        if app is not None:
            app.processEvents()


if __name__ == "__main__":
    unittest.main()
