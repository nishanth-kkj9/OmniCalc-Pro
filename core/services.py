"""
Service Locator / Dependency Injection Container.

Centralizes service management for: ThemeManager, HistoryManager, ConfigManager, CalculatorEngine.
"""
from __future__ import annotations

import atexit
import threading
from typing import Any, TypeVar, Callable

from utils.logger import get_logger

logger = get_logger()

T = TypeVar("T")


class ServiceLocator:
    """Thread-safe service locator with lazy initialization."""

    _instance: ServiceLocator | None = None
    _lock = threading.Lock()
    _services: dict[str, Any]
    _factories: dict[str, Callable[[], Any]]
    _singletons: dict[str, bool]
    _initialized: bool

    def __new__(cls) -> ServiceLocator:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    instance._services = {}
                    instance._factories = {}
                    instance._singletons = {}
                    instance._initialized = False
                    cls._instance = instance
        return cls._instance

    def register(self, name: str, factory: Callable[[], Any], singleton: bool = True) -> None:
        """Register a service factory."""
        self._factories[name] = factory
        self._singletons[name] = singleton
        if name in self._services:
            del self._services[name]

    def get(self, name: str) -> Any:
        """Get service instance, creating if needed."""
        if name not in self._factories:
            raise KeyError(f"Service not registered: {name}")

        is_singleton = self._singletons.get(name, True)
        if is_singleton:
            if name in self._services:
                return self._services[name]
            with self._lock:
                if name in self._services:
                    return self._services[name]
                instance = self._factories[name]()
                self._services[name] = instance
                logger.debug(f"Service created: {name} (singleton=True)")
                return instance

        instance = self._factories[name]()
        logger.debug(f"Service created: {name} (singleton=False)")
        return instance

    def has(self, name: str) -> bool:
        return name in self._services or name in self._factories

    def reset(self) -> None:
        """Clear all services (mainly for testing)."""
        for svc in self._services.values():
            if hasattr(svc, "close"):
                try:
                    svc.close()
                except Exception:
                    pass
        self._services.clear()
        self._factories.clear()


services = ServiceLocator()


def get_service(name: str) -> Any:
    return services.get(name)


def register_service(name: str, factory: Callable[[], Any], singleton: bool = True) -> None:
    services.register(name, factory, singleton)