from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QSlider, QComboBox
from PySide6.QtCore import Qt
from utils.constants import APP_NAME, VERSION
from utils.helpers import load_config, save_config

class SettingsPage(QWidget):
    config_changed = None
    def __init__(self):
        super().__init__()
        self.config = load_config()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("Settings", objectName="Title"))
        
        h = QHBoxLayout()
        h.addWidget(QLabel("Theme:"))
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["dark", "light"])
        self.theme_combo.setCurrentText(self.config.get("theme", "dark"))
        self.theme_combo.currentTextChanged.connect(self.apply_setting)
        h.addWidget(self.theme_combo)
        layout.addLayout(h)

        h2 = QHBoxLayout()
        h2.addWidget(QLabel("Font Size:"))
        self.font_slider = QSlider(Qt.Orientation.Horizontal)
        self.font_slider.setRange(10, 24)
        self.font_slider.setValue(self.config.get("font_size", 14))
        self.font_slider.valueChanged.connect(self.apply_setting)
        h2.addWidget(self.font_slider)
        layout.addLayout(h2)

        self.info = QLabel(f"{APP_NAME} v{VERSION}\nPython + PySide6")
        self.info.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.info)

    def apply_setting(self):
        self.config["theme"] = self.theme_combo.currentText()
        self.config["font_size"] = self.font_slider.value()
        save_config(self.config)
        if self.config_changed:
            self.config_changed(self.config)