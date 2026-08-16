import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from utils.constants import BASE_DIR, LOG_MAX_BYTES, LOG_BACKUP_COUNT

LOG_FILE: str = os.path.join(BASE_DIR, 'omnicalc_pro.log')


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("OmniCalcPro")
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        file_handler = RotatingFileHandler(
            LOG_FILE, mode='a', maxBytes=LOG_MAX_BYTES,
            backupCount=LOG_BACKUP_COUNT, encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_fmt = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(module)s:%(funcName)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_fmt)
        logger.addHandler(file_handler)

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_fmt = logging.Formatter('%(levelname)-8s | %(message)s')
        console_handler.setFormatter(console_fmt)
        logger.addHandler(console_handler)

    return logger


def get_logger() -> logging.Logger:
    return logging.getLogger("OmniCalcPro")
