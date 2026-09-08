"""
Formulas & Reference Library Desktop Page for OmniCalc Pro.
Provides a native PySide6 knowledge base of 59 physical constants, calculus,
algebra, geometry, matrix algebra, statistics, computer science, finance, and unit factors.
Supports full text search, category filtering, one-click formula/value copying,
and direct navigation bridges to corresponding calculator modes.
"""
from __future__ import annotations
from typing import Optional, List, Dict, Callable

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QScrollArea, QFrame, QApplication
)
from PySide6.QtCore import Qt, QTimer

from core.formulas_engine import (
    FormulasEngine, FormulaConstantItem, CATEGORIES, FORMULAS_AND_CONSTANTS_DATABASE
)
from utils.helpers import copy_to_clipboard


CALC_MODE_TO_PAGE_NAME: Dict[str, str] = {
    "basic": "Basic",
    "scientific": "Scientific",
    "graph": "Graph",
    "converter": "Converter",
    "programmer": "Programmer",
    "matrix": "Matrix",
    "statistics": "Statistics",
    "regression": "Regression",
    "probability": "Probability",
    "inference": "Inference",
    "equation": "Equation",
    "calculus": "Calculus",
    "complex": "Complex",
    "sequences": "Sequences",
    "physical_units": "Units",
    "fractions": "Fractions",
    "geometry": "Geometry",
    "finance": "Finance",
    "datetime": "DateTime",
    "health": "Health",
    "formulas": "Formulas",
    "history": "History",
    "settings": "Settings",
}


class FormulasPage(QWidget):
    """Native desktop knowledge base and reference library for formulas and constants."""

    def __init__(self, on_navigate_mode: Optional[Callable[[str], None]] = None) -> None:
        super().__init__()
        self.engine = FormulasEngine()
        self.on_navigate_mode = on_navigate_mode
        self._is_cleaned_up = False

        self.all_items: List[FormulaConstantItem] = list(FORMULAS_AND_CONSTANTS_DATABASE)
        self.selected_category: str = "All"
        self.search_text: str = ""

        # Map item.id -> card widget
        self.card_widgets: Dict[str, QFrame] = {}
        # Category buttons
        self.cat_buttons: Dict[str, QPushButton] = {}

        self.setup_ui()

    def setup_ui(self) -> None:
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # ----------------------------------------------------------------------
        # Top Banner / Header
        # ----------------------------------------------------------------------
        banner = QFrame(self)
        banner.setObjectName("BannerFrame")
        banner.setStyleSheet("""
            QFrame#BannerFrame {
                background-color: #1e1e2e;
                border: 1px solid #2e2e42;
                border-radius: 12px;
                padding: 12px;
            }
        """)
        banner_layout = QHBoxLayout(banner)
        banner_layout.setContentsMargins(8, 8, 8, 8)

        text_layout = QVBoxLayout()
        text_layout.setSpacing(4)

        title = QLabel("📖 Formulas & Constants Knowledge Base", banner)
        title.setObjectName("Title")
        title.setStyleSheet("font-size: 16px; font-weight: bold; color: #38bdf8;")
        text_layout.addWidget(title)

        subtitle = QLabel(
            "Comprehensive reference across physics, calculus, geometry, matrix algebra, "
            "statistics, computer science, finance, and unit constants supporting every section of OmniCalc Pro.",
            banner
        )
        subtitle.setWordWrap(True)
        subtitle.setStyleSheet("font-size: 11px; color: #94a3b8;")
        text_layout.addWidget(subtitle)

        banner_layout.addLayout(text_layout, 1)

        badge = QLabel(f"✨ {len(self.all_items)} Curated Items", banner)
        badge.setStyleSheet("""
            font-size: 11px;
            font-weight: bold;
            color: #f59e0b;
            background-color: #27273a;
            border: 1px solid #3b3b54;
            border-radius: 8px;
            padding: 6px 10px;
        """)
        banner_layout.addWidget(badge, 0, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        main_layout.addWidget(banner)

        # ----------------------------------------------------------------------
        # Search & Filter Bar
        # ----------------------------------------------------------------------
        controls_frame = QFrame(self)
        controls_frame.setObjectName("ControlsFrame")
        controls_frame.setStyleSheet("""
            QFrame#ControlsFrame {
                background-color: #1e1e2e;
                border: 1px solid #2e2e42;
                border-radius: 12px;
                padding: 10px;
            }
        """)
        controls_layout = QVBoxLayout(controls_frame)
        controls_layout.setContentsMargins(6, 6, 6, 6)
        controls_layout.setSpacing(8)

        # Search box + counter row
        search_row = QHBoxLayout()
        search_row.setSpacing(10)

        search_icon = QLabel("🔍", controls_frame)
        search_row.addWidget(search_icon)

        self.search_input = QLineEdit(controls_frame)
        self.search_input.setObjectName("SearchInput")
        self.search_input.setPlaceholderText("Search by name, symbol (π, c, e), formula, or module...")
        self.search_input.setClearButtonEnabled(True)
        self.search_input.setStyleSheet("""
            QLineEdit#SearchInput {
                background-color: #14141e;
                border: 1px solid #2e2e42;
                border-radius: 8px;
                padding: 6px 10px;
                font-size: 12px;
                color: #f1f5f9;
            }
            QLineEdit#SearchInput:focus {
                border: 1px solid #38bdf8;
            }
        """)
        self.search_input.textChanged.connect(self._on_search_changed)
        search_row.addWidget(self.search_input, 1)

        self.count_label = QLabel(f"Showing {len(self.all_items)} of {len(self.all_items)}", controls_frame)
        self.count_label.setStyleSheet("font-size: 11px; font-weight: bold; color: #38bdf8;")
        search_row.addWidget(self.count_label)

        # Category ComboBox for quick keyboard navigation
        self.cat_combo = QComboBox(controls_frame)
        self.cat_combo.setObjectName("CatCombo")
        self.cat_combo.addItems(CATEGORIES)
        self.cat_combo.setStyleSheet("""
            QComboBox#CatCombo {
                background-color: #14141e;
                border: 1px solid #2e2e42;
                border-radius: 8px;
                padding: 4px 8px;
                font-size: 11px;
                color: #cbd5e1;
            }
        """)
        self.cat_combo.currentTextChanged.connect(self._on_combo_category_changed)
        search_row.addWidget(self.cat_combo)

        controls_layout.addLayout(search_row)

        # Category button pills
        cats_scroll = QScrollArea(controls_frame)
        cats_scroll.setWidgetResizable(True)
        cats_scroll.setFixedHeight(38)
        cats_scroll.setFrameShape(QFrame.Shape.NoFrame)
        cats_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        cats_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        cats_container = QWidget()
        cats_layout = QHBoxLayout(cats_container)
        cats_layout.setContentsMargins(0, 0, 0, 0)
        cats_layout.setSpacing(6)

        for cat in CATEGORIES:
            btn = QPushButton(cat, cats_container)
            btn.setCheckable(True)
            if cat == "All":
                btn.setChecked(True)
            btn.clicked.connect(lambda _, c=cat: self.set_category(c))
            cats_layout.addWidget(btn)
            self.cat_buttons[cat] = btn

        cats_layout.addStretch(1)
        cats_scroll.setWidget(cats_container)
        controls_layout.addWidget(cats_scroll)

        main_layout.addWidget(controls_frame)

        self._update_category_buttons_style()

        # ----------------------------------------------------------------------
        # Cards Scroll Area
        # ----------------------------------------------------------------------
        self.cards_scroll = QScrollArea(self)
        self.cards_scroll.setObjectName("CardsScrollArea")
        self.cards_scroll.setWidgetResizable(True)
        self.cards_scroll.setFrameShape(QFrame.Shape.NoFrame)

        self.cards_container = QWidget()
        self.cards_layout = QVBoxLayout(self.cards_container)
        self.cards_layout.setContentsMargins(0, 0, 0, 0)
        self.cards_layout.setSpacing(10)

        # Build all 59 cards once
        for item in self.all_items:
            card = self._build_card(item)
            self.card_widgets[item.id] = card
            self.cards_layout.addWidget(card)

        # Empty search results placeholder widget
        self.no_results_widget = self._build_no_results_widget()
        self.no_results_widget.setVisible(False)
        self.cards_layout.addWidget(self.no_results_widget)

        self.cards_layout.addStretch(1)
        self.cards_scroll.setWidget(self.cards_container)
        main_layout.addWidget(self.cards_scroll, 1)

    def _build_card(self, item: FormulaConstantItem) -> QFrame:
        card = QFrame(self.cards_container)
        card.setObjectName("FormulaCard")
        card.setStyleSheet("""
            QFrame#FormulaCard {
                background-color: #1a1a28;
                border: 1px solid #28283c;
                border-radius: 12px;
                padding: 10px;
            }
        """)
        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(8)

        # Header Row
        header = QHBoxLayout()
        header.setSpacing(8)

        if item.symbol:
            sym_lbl = QLabel(item.symbol, card)
            sym_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            sym_lbl.setStyleSheet("""
                font-family: monospace;
                font-size: 13px;
                font-weight: bold;
                color: #38bdf8;
                background-color: #0c4a6e;
                border: 1px solid #0284c7;
                border-radius: 6px;
                padding: 2px 6px;
                min-width: 24px;
            """)
            header.addWidget(sym_lbl)

        title_box = QVBoxLayout()
        title_box.setSpacing(2)
        name_lbl = QLabel(item.name, card)
        name_lbl.setStyleSheet("font-size: 13px; font-weight: bold; color: #f1f5f9;")
        title_box.addWidget(name_lbl)

        if item.unit:
            unit_lbl = QLabel(f"Unit: {item.unit}", card)
            unit_lbl.setStyleSheet("font-family: monospace; font-size: 10px; color: #94a3b8;")
            title_box.addWidget(unit_lbl)

        header.addLayout(title_box, 1)

        cat_badge = QLabel(item.category.upper(), card)
        cat_badge.setStyleSheet("""
            font-size: 9px;
            font-weight: bold;
            color: #38bdf8;
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 3px 8px;
        """)
        header.addWidget(cat_badge, 0, Qt.AlignmentFlag.AlignTop)
        layout.addLayout(header)

        # Description
        desc_lbl = QLabel(item.description, card)
        desc_lbl.setWordWrap(True)
        desc_lbl.setStyleSheet("font-size: 11px; color: #cbd5e1;")
        layout.addWidget(desc_lbl)

        # Notes if present
        if item.notes:
            notes_lbl = QLabel(f"💡 {item.notes}", card)
            notes_lbl.setWordWrap(True)
            notes_lbl.setStyleSheet("""
                font-size: 10px;
                font-style: italic;
                color: #94a3b8;
                background-color: #13131e;
                border: 1px solid #232336;
                border-radius: 6px;
                padding: 5px 8px;
            """)
            layout.addWidget(notes_lbl)

        # Formula & Values Box
        fbox = QFrame(card)
        fbox.setObjectName("FormulaInnerBox")
        fbox.setStyleSheet("""
            QFrame#FormulaInnerBox {
                background-color: #12121c;
                border: 1px solid #232336;
                border-radius: 8px;
                padding: 6px;
            }
        """)
        fbox_layout = QVBoxLayout(fbox)
        fbox_layout.setContentsMargins(8, 6, 8, 6)
        fbox_layout.setSpacing(6)

        formula_row = QHBoxLayout()
        formula_row.setSpacing(8)

        form_lbl = QLabel(item.formula, fbox)
        form_lbl.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        form_lbl.setStyleSheet("font-family: monospace; font-size: 12px; font-weight: bold; color: #7dd3fc;")
        formula_row.addWidget(form_lbl, 1)

        actions_box = QHBoxLayout()
        actions_box.setSpacing(6)

        if item.numeric_value is not None:
            val_btn = QPushButton("Value", fbox)
            val_btn.setToolTip("Copy exact numeric value")
            val_btn.setStyleSheet("""
                QPushButton {
                    background-color: #1e293b;
                    border: 1px solid #334155;
                    color: #7dd3fc;
                    border-radius: 6px;
                    padding: 3px 8px;
                    font-size: 10px;
                    font-weight: bold;
                }
                QPushButton:hover {
                    background-color: #334155;
                    color: #ffffff;
                }
            """)
            val_btn.clicked.connect(lambda _, b=val_btn, val=item.numeric_value: self.copy_text(val, b, "Value"))
            actions_box.addWidget(val_btn)

        copy_btn = QPushButton("Copy", fbox)
        copy_btn.setToolTip("Copy formula text")
        copy_btn.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                border: 1px solid #334155;
                color: #cbd5e1;
                border-radius: 6px;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #ffffff;
            }
        """)
        copy_btn.clicked.connect(lambda _, b=copy_btn, form=item.formula: self.copy_text(form, b, "Copy"))
        actions_box.addWidget(copy_btn)

        formula_row.addLayout(actions_box)
        fbox_layout.addLayout(formula_row)

        # Related Modes / Works with
        works_row = QHBoxLayout()
        works_row.setSpacing(6)
        works_lbl = QLabel("Works with:", fbox)
        works_lbl.setStyleSheet("font-size: 10px; font-weight: bold; color: #64748b;")
        works_row.addWidget(works_lbl)

        for mode in item.related_modes:
            mode_btn = QPushButton(mode, fbox)
            mode_btn.setToolTip(f"Jump to {mode} calculator")
            mode_btn.setStyleSheet("""
                QPushButton {
                    background-color: #1e1e2d;
                    border: 1px solid #2d2d42;
                    color: #94a3b8;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 9px;
                    font-weight: 500;
                }
                QPushButton:hover {
                    background-color: #0369a1;
                    color: #ffffff;
                    border: 1px solid #0284c7;
                }
            """)
            mode_btn.clicked.connect(lambda _, m=mode: self.navigate_to_mode(m))
            works_row.addWidget(mode_btn)

        works_row.addStretch(1)
        fbox_layout.addLayout(works_row)

        layout.addWidget(fbox)
        return card

    def _build_no_results_widget(self) -> QFrame:
        frame = QFrame(self.cards_container)
        frame.setObjectName("NoResultsFrame")
        frame.setStyleSheet("""
            QFrame#NoResultsFrame {
                background-color: #1e1e2e;
                border: 1px solid #2e2e42;
                border-radius: 12px;
                padding: 32px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(10)

        icon = QLabel("❓", frame)
        icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        icon.setStyleSheet("font-size: 32px;")
        layout.addWidget(icon)

        title = QLabel("No matching formulas or constants", frame)
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("font-size: 14px; font-weight: bold; color: #f1f5f9;")
        layout.addWidget(title)

        desc = QLabel(
            'Try searching for a different keyword like "integral", "derivative", "pi", "gravity", "EMI", or "binary".',
            frame
        )
        desc.setAlignment(Qt.AlignmentFlag.AlignCenter)
        desc.setWordWrap(True)
        desc.setStyleSheet("font-size: 11px; color: #94a3b8; max-width: 380px;")
        layout.addWidget(desc)

        clear_btn = QPushButton("Clear Search Filter", frame)
        clear_btn.setStyleSheet("""
            QPushButton {
                background-color: #0284c7;
                color: #ffffff;
                font-size: 11px;
                font-weight: bold;
                border: none;
                border-radius: 8px;
                padding: 6px 14px;
            }
            QPushButton:hover {
                background-color: #0369a1;
            }
        """)
        clear_btn.clicked.connect(self.clear_expression)
        layout.addWidget(clear_btn, 0, Qt.AlignmentFlag.AlignCenter)

        return frame

    def _update_category_buttons_style(self) -> None:
        for cat, btn in self.cat_buttons.items():
            is_active = cat == self.selected_category
            btn.setChecked(is_active)
            if is_active:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #0284c7;
                        color: #ffffff;
                        font-size: 10px;
                        font-weight: bold;
                        border: 1px solid #38bdf8;
                        border-radius: 8px;
                        padding: 4px 10px;
                    }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #14141e;
                        color: #94a3b8;
                        font-size: 10px;
                        font-weight: 500;
                        border: 1px solid #27273a;
                        border-radius: 8px;
                        padding: 4px 10px;
                    }
                    QPushButton:hover {
                        background-color: #1e1e2e;
                        color: #f1f5f9;
                        border: 1px solid #3e3e56;
                    }
                """)

    def set_category(self, category: str) -> None:
        if category not in CATEGORIES:
            return
        self.selected_category = category
        if self.cat_combo.currentText() != category:
            self.cat_combo.blockSignals(True)
            self.cat_combo.setCurrentText(category)
            self.cat_combo.blockSignals(False)

        self._update_category_buttons_style()
        self.apply_filter()

    def _on_combo_category_changed(self, category: str) -> None:
        self.set_category(category)

    def _on_search_changed(self, text: str) -> None:
        self.search_text = text
        self.apply_filter()

    def apply_filter(self) -> None:
        """Applies category and search filters to all cards."""
        filtered = FormulasEngine.filter_items(
            category=self.selected_category,
            search=self.search_text,
            database=self.all_items,
        )
        filtered_ids = {it.id for it in filtered}

        for item in self.all_items:
            card = self.card_widgets.get(item.id)
            if card:
                card.setVisible(item.id in filtered_ids)

        has_results = len(filtered_ids) > 0
        self.no_results_widget.setVisible(not has_results)
        self.count_label.setText(f"Showing {len(filtered_ids)} of {len(self.all_items)}")

    def copy_text(self, text: str, button: Optional[QPushButton] = None, original_text: str = "") -> None:
        """Copies text to clipboard with native visual feedback."""
        try:
            app = QApplication.instance()
            if app:
                cb = app.clipboard()
                if cb:
                    cb.setText(text)
        except Exception:
            pass

        try:
            copy_to_clipboard(text)
        except Exception:
            pass

        if button is not None and original_text:
            button.setText("✓ Copied")
            QTimer.singleShot(1500, lambda: self._restore_btn_text(button, original_text))

    def _restore_btn_text(self, button: QPushButton, original_text: str) -> None:
        if not getattr(self, "_is_cleaned_up", False):
            try:
                button.setText(original_text)
            except Exception:
                pass

    def navigate_to_mode(self, mode: str) -> bool:
        """Navigates to the corresponding calculator mode in the desktop suite."""
        if self.on_navigate_mode:
            try:
                self.on_navigate_mode(mode)
                return True
            except Exception:
                pass

        target_name = CALC_MODE_TO_PAGE_NAME.get(mode.lower(), mode.title())
        app = QApplication.instance()
        if app:
            for widget in app.topLevelWidgets():
                if hasattr(widget, "switch_page") and hasattr(widget, "page_factories"):
                    for idx, (name, _) in enumerate(widget.page_factories):
                        if name.lower() == target_name.lower():
                            widget.switch_page(idx)
                            return True
        return False

    def calculate(self) -> None:
        """Common controller method."""
        self.apply_filter()

    def clear_expression(self) -> None:
        """Common controller method: resets filter and search."""
        self.search_input.clear()
        self.set_category("All")

    def cleanup(self) -> None:
        """Safely disconnect signals to prevent crash during Qt teardown."""
        self._is_cleaned_up = True
        try:
            self.search_input.blockSignals(True)
            self.cat_combo.blockSignals(True)
        except Exception:
            pass
        try:
            self.search_input.textChanged.disconnect(self._on_search_changed)
        except Exception:
            pass
        try:
            self.cat_combo.currentTextChanged.disconnect(self._on_combo_category_changed)
        except Exception:
            pass

    def closeEvent(self, event) -> None:
        self.cleanup()
        super().closeEvent(event)
