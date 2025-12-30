"""
Structured Logging Configuration
Provides consistent logging across the AI insights module.
"""

import logging
import sys
from datetime import datetime
from typing import Optional


class StructuredFormatter(logging.Formatter):
    """Custom formatter that adds structured fields to log records."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if hasattr(record, "query"):
            log_data["query"] = record.query
        if hasattr(record, "confidence"):
            log_data["confidence"] = record.confidence
        if hasattr(record, "source_type"):
            log_data["source_type"] = record.source_type
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "error"):
            log_data["error"] = record.error

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        formatted = " | ".join(f"{k}={v}" for k, v in log_data.items())
        return formatted


def setup_logger(
    name: str, level: Optional[str] = None, log_file: Optional[str] = None
) -> logging.Logger:
    """
    Setup a structured logger.

    Args:
        name: Logger name (typically __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for logging to file

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    log_level = getattr(logging, level or "INFO")
    logger.setLevel(log_level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(StructuredFormatter())
    logger.addHandler(console_handler)

    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(log_level)
        file_handler.setFormatter(StructuredFormatter())
        logger.addHandler(file_handler)

    logger.propagate = False

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get or create a logger with the given name."""
    return setup_logger(name)
