import unittest
import cmath
import math
from core.complex_engine import ComplexEngine


class TestComplexEngine(unittest.TestCase):
    def test_polar_conversion(self):
        z = complex(3.0, 4.0)
        r, phi_deg = ComplexEngine.to_polar(z, deg=True)
        self.assertAlmostEqual(r, 5.0, places=4)
        self.assertAlmostEqual(phi_deg, 53.1301, places=3)

    def test_roots(self):
        # 4th roots of 1
        roots = ComplexEngine.roots(1.0 + 0.0j, 4)
        self.assertEqual(len(roots), 4)
        for r in roots:
            self.assertAlmostEqual(abs(r ** 4), 1.0, places=4)

    def test_rlc_impedance(self):
        # R=10, L=0.01, C=0.0001, f=50
        z = ComplexEngine.rlc_impedance(10.0, 0.01, 0.0001, 50.0)
        self.assertEqual(z.real, 10.0)
        # omega = 2*pi*50 = 314.159, X_L = 3.1416, X_C = 1 / (314.159 * 0.0001) = 31.83
        self.assertAlmostEqual(z.imag, 3.14159 - 31.83099, places=2)


if __name__ == "__main__":
    unittest.main()
