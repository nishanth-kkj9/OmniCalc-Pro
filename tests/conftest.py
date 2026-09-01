import sys
import os
import pytest

# Set headless Qt platform and non-interactive Matplotlib backend for CI/CD across all OSes
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["QT_LOGGING_RULES"] = "*.debug=false;qt.qpa.*=false"
os.environ["MPLBACKEND"] = "Agg"

# Add the project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Global test session fixture for QApplication
@pytest.fixture(scope="session", autouse=True)
def qapp():
    try:
        from PySide6.QtWidgets import QApplication
        app = QApplication.instance()
        if app is None:
            app = QApplication([sys.argv[0] if sys.argv else "pytest", "-platform", "offscreen"])
        yield app
    except Exception:
        yield None


