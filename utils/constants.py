import os
import sys

if getattr(sys, 'frozen', False):
    BASE_DIR: str = os.path.dirname(sys.executable)
else:
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ASSETS_DIR: str = os.path.join(BASE_DIR, 'assets')
THEMES_DIR: str = os.path.join(ASSETS_DIR, 'themes')
ICONS_DIR: str = os.path.join(ASSETS_DIR, 'icons')
DB_DIR: str = os.path.join(BASE_DIR, 'database')
DB_PATH: str = os.path.join(DB_DIR, 'history.db')
CONFIG_PATH: str = os.path.join(BASE_DIR, 'config.json')

APP_NAME: str = "OmniCalc Pro"
VERSION: str = "2.1.0"

# UI sizing
COLLAPSED_WIDTH: int = 64
EXPANDED_WIDTH: int = 200
SIDEBAR_ANIM_DURATION: int = 200
SIDEBAR_BUTTON_MIN_HEIGHT: int = 44
SIDEBAR_FONT_SIZE: int = 11
SIDEBAR_MARGIN: int = 12
SIDEBAR_SPACING: int = 4

# Button sizing
BUTTON_MIN_WIDTH: int = 52
BUTTON_MIN_HEIGHT: int = 44
BUTTON_PRESS_OFFSET: int = 2
BUTTON_SCALE_ANIM_DURATION: int = 80
BUTTON_OPACITY_ANIM_DURATION: int = 100
BUTTON_BORDER_RADIUS: int = 10
BUTTON_PRESS_OPACITY: float = 0.8

# Display panel
DISPLAY_FONT_SIZE: int = 34
DISPLAY_MIN_HEIGHT: int = 80
DISPLAY_PADDING_H: int = 20
DISPLAY_PADDING_V: int = 16
DISPLAY_BORDER_RADIUS: int = 14
DISPLAY_FLASH_DURATION: int = 150
DISPLAY_BORDER_WIDTH: int = 2

# Toast notifications
TOAST_WIDTH: int = 340
TOAST_FADE_DURATION: int = 200
TOAST_SLIDE_IN_DURATION: int = 250
TOAST_SLIDE_OUT_DURATION: int = 200
TOAST_MARGIN: int = 20
TOAST_SPACING: int = 8
TOAST_DEFAULT_DURATION: int = 3000
TOAST_ICON_SIZE: int = 20
TOAST_CLOSE_SIZE: int = 20

# Safe evaluator limits
MAX_EXPR_LENGTH: int = 500
MAX_RESULT_DIGITS: int = 50
MAX_EXECUTION_TIME: float = 5.0
MAX_NESTING_DEPTH: int = 10

# Icons
ICON_SIZE: int = 24

# Logger
LOG_MAX_BYTES: int = 5 * 1024 * 1024  # 5 MB
LOG_BACKUP_COUNT: int = 3
