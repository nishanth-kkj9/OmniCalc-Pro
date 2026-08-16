import sys
import os

# Ensure headless Qt operation in CI / Linux environments
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

# Add the project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)