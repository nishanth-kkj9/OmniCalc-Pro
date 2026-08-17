import sys
import os

# Set headless Qt platform and non-interactive Matplotlib backend for CI/CD across all OSes
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["QT_LOGGING_RULES"] = "*.debug=false;qt.qpa.*=false"
os.environ["MPLBACKEND"] = "Agg"

# Add the project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Initialize a global offscreen QApplication instance
try:
    from PySide6.QtWidgets import QApplication
    if QApplication.instance() is None:
        _app = QApplication([sys.argv[0] if sys.argv else "pytest", "-platform", "offscreen"])
except Exception:
    pass

