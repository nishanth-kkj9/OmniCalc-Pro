import unittest
from core.services import ServiceLocator, get_service, register_service


class TestServiceLocator(unittest.TestCase):
    def setUp(self):
        self.locator = ServiceLocator()

    def tearDown(self):
        self.locator.reset()

    def test_register_and_get(self):
        self.locator.register("math", lambda: 42)
        result = self.locator.get("math")
        self.assertEqual(result, 42)

    def test_get_returns_singleton(self):
        self.locator.register("counter", lambda: object())
        a = self.locator.get("counter")
        b = self.locator.get("counter")
        self.assertIs(a, b)

    def test_get_non_singleton(self):
        self.locator.register("factory", lambda: object(), singleton=False)
        a = self.locator.get("factory")
        b = self.locator.get("factory")
        self.assertIsNot(a, b)

    def test_has_registered(self):
        self.locator.register("svc", lambda: 1)
        self.assertTrue(self.locator.has("svc"))
        self.assertFalse(self.locator.has("nonexistent"))

    def test_get_unregistered_raises(self):
        with self.assertRaises(KeyError):
            self.locator.get("nonexistent")

    def test_reset_clears_all(self):
        self.locator.register("a", lambda: 1)
        self.locator.register("b", lambda: 2)
        self.locator.reset()
        self.assertFalse(self.locator.has("a"))
        self.assertFalse(self.locator.has("b"))

    def test_register_overwrites_factory(self):
        self.locator.register("svc", lambda: 1)
        v1 = self.locator.get("svc")
        self.locator.register("svc", lambda: 2)
        v2 = self.locator.get("svc")
        self.assertEqual(v2, 2)

    def test_global_functions(self):
        register_service("test", lambda: "global")
        result = get_service("test")
        self.assertEqual(result, "global")
        ServiceLocator().reset()
