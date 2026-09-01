"""
OmniCalc Pro - Native Desktop Application Entry Point
"""
import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFont
from ui.main_window import MainWindow
from ui.fluent_theme import get_theme
from utils.helpers import load_config
from utils.logger import setup_logger, get_logger

def main():
    setup_logger()
    logger = get_logger()
    logger.info("Starting OmniCalc Pro Desktop Application...")
    
    app = QApplication(sys.argv)
    app.setApplicationName("OmniCalc Pro")
    app.setOrganizationName("OmniCalc")
    
    # Wire global crash and error recovery handler
    from core.error_handler import install_global_handler
    install_global_handler(app)
    
    config = load_config()
    theme = get_theme(app)
    theme.apply(config.get("theme", "dark"))
    app.setFont(QFont("Segoe UI", config.get("font_size", 14)))
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
