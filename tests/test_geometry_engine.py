import unittest
from core.geometry_engine import GeometryEngine


class TestGeometryEngine(unittest.TestCase):
    def test_triangle_sss(self):
        res = GeometryEngine.solve_triangle_sss(5.0, 6.0, 7.0)
        self.assertAlmostEqual(res["area"], 14.696938, places=4)
        self.assertAlmostEqual(res["perimeter"], 18.0)

    def test_triangle_ssa_ambiguous(self):
        # a = 5, b = 8, A = 30° -> h = 8 * sin(30°) = 4. Since 4 < 5 < 8, 2 valid triangles exist!
        res = GeometryEngine.solve_triangle_ssa(5.0, 8.0, 30.0)
        self.assertEqual(res["num_solutions"], 2)

    def test_2d_shape_circle(self):
        res = GeometryEngine.solve_2d_shape("circle", 5.0)
        self.assertAlmostEqual(res["area"], 78.539816, places=4)

    def test_3d_shape_cylinder(self):
        res = GeometryEngine.solve_3d_shape("cylinder", 4.0, 10.0)
        self.assertAlmostEqual(res["volume"], 502.65482, places=3)

    def test_2d_line(self):
        res = GeometryEngine.analyze_2d_line(1.0, 2.0, 5.0, 8.0)
        self.assertAlmostEqual(res["distance"], 7.21110255, places=4)
        self.assertAlmostEqual(res["slope"], 1.5)

    def test_vectors_3d(self):
        res = GeometryEngine.analyze_vectors_3d(2.0, 3.0, -1.0, 4.0, 0.0, 5.0)
        self.assertEqual(res["dot_product"], 3.0)
        self.assertEqual(res["cross_product"], (15.0, -14.0, -12.0))


if __name__ == "__main__":
    unittest.main()
