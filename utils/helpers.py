import os
import json
from typing import Any, Dict, Union
import pyperclip
from utils.constants import BASE_DIR, CONFIG_PATH
from utils.logger import get_logger
from core.safe_evaluator import safe_eval as _safe_eval

logger = get_logger()


def ensure_dirs() -> None:
    dirs = [
        os.path.join(BASE_DIR, 'assets', 'icons'),
        os.path.join(BASE_DIR, 'assets', 'images'),
        os.path.join(BASE_DIR, 'assets', 'themes'),
        os.path.join(BASE_DIR, 'database')
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    logger.debug("Project directories ensured.")


def load_config() -> Dict[str, Any]:
    default_config: Dict[str, Any] = {"theme": "dark", "font_size": 14, "angle_mode": "degrees"}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
                if isinstance(cfg, dict):
                    logger.debug("Config file loaded.")
                    return cfg
                logger.warning("Config file is not a valid JSON object. Using defaults.")
                return default_config
        except (json.JSONDecodeError, IOError, OSError) as e:
            logger.warning(f"Failed to read/parse config file ({e}). Using defaults.")
            return default_config
    logger.warning("Config file not found. Using defaults.")
    return default_config


def save_config(cfg: Dict[str, Any]) -> None:
    try:
        config_dir = os.path.dirname(CONFIG_PATH)
        if config_dir:
            os.makedirs(config_dir, exist_ok=True)
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, indent=2)
        logger.debug("Configuration saved.")
    except (IOError, OSError) as e:
        logger.error(f"Failed to save configuration: {e}")


def safe_eval(expression: str, mode: str = "degrees") -> Union[float, str]:
    return _safe_eval(expression, mode)


def copy_to_clipboard(text: str) -> None:
    try:
        pyperclip.copy(str(text))
        logger.debug(f"Copied to clipboard: {text}")
    except Exception as e:
        logger.warning(f"Clipboard copy failed: {e}")


def paste_from_clipboard() -> str:
    try:
        return str(pyperclip.paste())
    except Exception:
        return ""
