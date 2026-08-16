import sys
import os

# Set headless Qt platform for CI and containerized environments
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["MPLBACKEND"] = "Agg"

# Add the project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Initialize a global offscreen QApplication instance if PySide6 is imported
try:
    from PySide6.QtWidgets import QApplication
    if QApplication.instance() is None:
        _app = QApplication(["--platform", "offscreen"])
except Exception:
    pass
