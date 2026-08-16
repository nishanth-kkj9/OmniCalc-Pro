import unittest
import numpy as np
from core.matrix_engine import MatrixEngine


class TestMatrixEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MatrixEngine()

    def test_parse_2x2(self):
        result = self.engine.parse("1,2;3,4")
        expected = np.array([[1.0, 2.0], [3.0, 4.0]])
        np.testing.assert_array_equal(result, expected)

    def test_parse_3x3(self):
        result = self.engine.parse("1,2,3;4,5,6;7,8,9")
        expected = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]])
        np.testing.assert_array_equal(result, expected)

    def test_add(self):
        a = np.array([[1, 2], [3, 4]])
        b = np.array([[5, 6], [7, 8]])
        result = self.engine.add(a, b)
        expected = np.array([[6, 8], [10, 12]])
        np.testing.assert_array_equal(result, expected)

    def test_sub(self):
        a = np.array([[5, 6], [7, 8]])
        b = np.array([[1, 2], [3, 4]])
        result = self.engine.sub(a, b)
        expected = np.array([[4, 4], [4, 4]])
        np.testing.assert_array_equal(result, expected)

    def test_mul(self):
        a = np.array([[1, 2], [3, 4]])
        b = np.array([[2, 0], [1, 2]])
        result = self.engine.mul(a, b)
        expected = np.dot(a, b)
        np.testing.assert_array_equal(result, expected)

    def test_det(self):
        a = np.array([[1, 2], [3, 4]])
        result = self.engine.det(a)
        self.assertAlmostEqual(result, -2.0)

    def test_inv(self):
        a = np.array([[1, 2], [3, 4]])
        result = self.engine.inv(a)
        expected = np.linalg.inv(a)
        np.testing.assert_array_almost_equal(result, expected)

    def test_trans(self):
        a = np.array([[1, 2], [3, 4]])
        result = self.engine.trans(a)
        expected = np.array([[1, 3], [2, 4]])
        np.testing.assert_array_equal(result, expected)

    def test_identity_inverse(self):
        a = np.array([[1, 0], [0, 1]])
        result = self.engine.inv(a)
        np.testing.assert_array_almost_equal(result, a)
