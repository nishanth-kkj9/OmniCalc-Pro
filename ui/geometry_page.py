from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout
)
from PySide6.QtCore import Qt
from core.geometry_engine import GeometryEngine
from core.history_manager import get_history_manager


class GeometryPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = GeometryEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("📐 Geometry, Coordinates & Vector Algebra")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Geometry Module:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Triangle Solver (SSS, SSA Ambiguous Case)",
            "2D Plane Shapes (Area & Perimeter)",
            "3D Geometry & Solids (Volume & Surface Area)",
            "2D Line & Coordinate Analysis",
            "2D / 3D Vector Algebra (Dot, Cross, Projection)"
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Triangle Panel
        tri_widget = QWidget()
        tri_form = QFormLayout(tri_widget)
        self.tri_type = QComboBox()
        self.tri_type.addItems(["SSS (3 Sides: a, b, c)", "SSA (Sides a, b and Angle A)"])
        self.tri_a = QLineEdit("5")
        self.tri_b = QLineEdit("6")
        self.tri_c_or_A = QLineEdit("7")
        self.tri_param_label = QLabel("Side c (for SSS) / Angle A in deg (for SSA):")

        self.tri_type.currentIndexChanged.connect(self._on_tri_type_changed)
        tri_form.addRow("Triangle Mode:", self.tri_type)
        tri_form.addRow("Side a:", self.tri_a)
        tri_form.addRow("Side b:", self.tri_b)
        tri_form.addRow(self.tri_param_label, self.tri_c_or_A)
        self.inputs_layout.addWidget(tri_widget)

        # 1. 2D Shapes Panel
        s2d_widget = QWidget()
        s2d_form = QFormLayout(s2d_widget)
        self.s2d_type = QComboBox()
        self.s2d_type.addItems(["circle", "sector", "ellipse", "trapezoid", "polygon"])
        self.s2d_p1 = QLineEdit("5")
        self.s2d_p1_label = QLabel("Radius / Semi-major a / Base1 / Side length:")
        self.s2d_p2 = QLineEdit("8")
        self.s2d_p2_label = QLabel("Angle deg / Semi-minor b / Base2 / N sides:")
        self.s2d_p3 = QLineEdit("4")
        self.s2d_p3_label = QLabel("Height (Trapezoid):")

        s2d_form.addRow("Shape Type:", self.s2d_type)
        s2d_form.addRow(self.s2d_p1_label, self.s2d_p1)
        s2d_form.addRow(self.s2d_p2_label, self.s2d_p2)
        s2d_form.addRow(self.s2d_p3_label, self.s2d_p3)
        self.inputs_layout.addWidget(s2d_widget)

        # 2. 3D Shapes Panel
        s3d_widget = QWidget()
        s3d_form = QFormLayout(s3d_widget)
        self.s3d_type = QComboBox()
        self.s3d_type.addItems(["sphere", "cylinder", "cone", "prism", "pyramid"])
        self.s3d_p1 = QLineEdit("4")
        self.s3d_p1_label = QLabel("Radius / Length:")
        self.s3d_p2 = QLineEdit("10")
        self.s3d_p2_label = QLabel("Height / Width:")
        self.s3d_p3 = QLineEdit("6")
        self.s3d_p3_label = QLabel("Height (Prism/Pyramid):")

        s3d_form.addRow("Solid Type:", self.s3d_type)
        s3d_form.addRow(self.s3d_p1_label, self.s3d_p1)
        s3d_form.addRow(self.s3d_p2_label, self.s3d_p2)
        s3d_form.addRow(self.s3d_p3_label, self.s3d_p3)
        self.inputs_layout.addWidget(s3d_widget)

        # 3. 2D Line Panel
        line_widget = QWidget()
        line_form = QFormLayout(line_widget)
        self.line_x1 = QLineEdit("1")
        self.line_y1 = QLineEdit("2")
        self.line_x2 = QLineEdit("5")
        self.line_y2 = QLineEdit("8")

        line_form.addRow("Point 1 (x1):", self.line_x1)
        line_form.addRow("Point 1 (y1):", self.line_y1)
        line_form.addRow("Point 2 (x2):", self.line_x2)
        line_form.addRow("Point 2 (y2):", self.line_y2)
        self.inputs_layout.addWidget(line_widget)

        # 4. Vectors Panel
        vec_widget = QWidget()
        vec_form = QFormLayout(vec_widget)
        self.vec_dim = QComboBox()
        self.vec_dim.addItems(["2D Vectors (u, v)", "3D Vectors (u, v)"])
        self.vec_ux = QLineEdit("2")
        self.vec_uy = QLineEdit("3")
        self.vec_uz = QLineEdit("-1")
        self.vec_vx = QLineEdit("4")
        self.vec_vy = QLineEdit("0")
        self.vec_vz = QLineEdit("5")

        vec_form.addRow("Vector Dimension:", self.vec_dim)
        vec_form.addRow("Vector u (ux, uy, uz):", self.vec_ux)
        vec_form.addRow("Vector u components (y, z):", self.vec_uy)
        vec_form.addRow("Vector u component z:", self.vec_uz)
        vec_form.addRow("Vector v (vx, vy, vz):", self.vec_vx)
        vec_form.addRow("Vector v component y:", self.vec_vy)
        vec_form.addRow("Vector v component z:", self.vec_vz)
        self.inputs_layout.addWidget(vec_widget)

        layout.addWidget(self.inputs_group)

        # Calculate Button
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Calculate Geometry & Vectors")
        self.calc_btn.setStyleSheet("""
            QPushButton {
                background-color: #00ffaa; color: #111; font-weight: bold;
                padding: 8px 16px; border-radius: 6px;
            }
            QPushButton:hover { background-color: #00cc88; }
        """)
        self.calc_btn.clicked.connect(self.calculate)
        btn_layout.addWidget(self.calc_btn)
        layout.addLayout(btn_layout)

        # Output Text
        output_group = QGroupBox("Geometrical Results & Vectors Analysis")
        out_layout = QVBoxLayout(output_group)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.output)
        layout.addWidget(output_group)

    def _on_mode_changed(self, idx: int):
        self.inputs_layout.setCurrentIndex(idx)

    def _on_tri_type_changed(self, idx: int):
        if idx == 0:
            self.tri_param_label.setText("Side c (for SSS):")
        else:
            self.tri_param_label.setText("Angle A in deg (for SSA):")

    def calculate(self):
        idx = self.mode_combo.currentIndex()
        try:
            if idx == 0:  # Triangle
                t_idx = self.tri_type.currentIndex()
                a = float(self.tri_a.text())
                b = float(self.tri_b.text())
                c_or_A = float(self.tri_c_or_A.text())

                if t_idx == 0:  # SSS
                    res = self.engine.solve_triangle_sss(a, b, c_or_A)
                    out = [
                        f"=== TRIANGLE SOLVER (SSS) ===",
                        f"Sides: a = {res['a']:g}, b = {res['b']:g}, c = {res['c']:g}",
                        "",
                        f"Angle A (α): {res['angle_A_deg']:.4f}°",
                        f"Angle B (β): {res['angle_B_deg']:.4f}°",
                        f"Angle C (γ): {res['angle_C_deg']:.4f}°",
                        f"Perimeter:   {res['perimeter']:.4f}",
                        f"Area:        {res['area']:.4f}",
                        f"Inradius:    {res['inradius']:.4f}",
                        f"Circumradius:{res['circumradius']:.4f}"
                    ]
                    res_str = f"Area = {res['area']:.4f}"
                    summary_expr = f"Triangle SSS: a={a}, b={b}, c={c_or_A}"
                else:  # SSA
                    res = self.engine.solve_triangle_ssa(a, b, c_or_A)
                    out = [
                        f"=== TRIANGLE SOLVER (SSA AMBIGUOUS CASE) ===",
                        f"Message: {res['message']}",
                        f"Valid Solutions Found: {res['num_solutions']}",
                        ""
                    ]
                    for s_idx, sol in enumerate(res["solutions"]):
                        out.append(f"--- Solution #{s_idx + 1} ---")
                        out.append(f"  Sides:   a={sol['a']:g}, b={sol['b']:g}, c={sol['c']:.4f}")
                        out.append(f"  Angles:  A={sol['angle_A_deg']:.2f}°, B={sol['angle_B_deg']:.2f}°, C={sol['angle_C_deg']:.2f}°")
                        out.append(f"  Area:    {sol['area']:.4f}")

                    res_str = f"{res['num_solutions']} solution(s)"
                    summary_expr = f"Triangle SSA: a={a}, b={b}, A={c_or_A}°"

            elif idx == 1:  # 2D Shapes
                shape = self.s2d_type.currentText()
                p1 = float(self.s2d_p1.text())
                p2 = float(self.s2d_p2.text())
                p3 = float(self.s2d_p3.text())

                res = self.engine.solve_2d_shape(shape, p1, p2, p3)
                out = [f"=== 2D SHAPE: {res['shape'].upper()} ==="]
                for k, v in res.items():
                    if k != "shape":
                        out.append(f"{k.replace('_', ' ').title()}: {v:.8g}" if isinstance(v, float) else f"{k.title()}: {v}")
                res_str = f"Area = {res.get('area', 0):.4f}"
                summary_expr = f"2D Shape: {shape}"

            elif idx == 2:  # 3D Shapes
                solid = self.s3d_type.currentText()
                p1 = float(self.s3d_p1.text())
                p2 = float(self.s3d_p2.text())
                p3 = float(self.s3d_p3.text())

                res = self.engine.solve_3d_shape(solid, p1, p2, p3)
                out = [f"=== 3D SOLID: {res['shape'].upper()} ==="]
                for k, v in res.items():
                    if k != "shape":
                        out.append(f"{k.replace('_', ' ').title()}: {v:.8g}" if isinstance(v, float) else f"{k.title()}: {v}")
                res_str = f"Volume = {res.get('volume', 0):.4f}"
                summary_expr = f"3D Solid: {solid}"

            elif idx == 3:  # 2D Line
                x1, y1 = float(self.line_x1.text()), float(self.line_y1.text())
                x2, y2 = float(self.line_x2.text()), float(self.line_y2.text())

                res = self.engine.analyze_2d_line(x1, y1, x2, y2)
                out = [
                    f"=== 2D LINE ANALYSIS ===",
                    f"Point 1: ({x1:g}, {y1:g}), Point 2: ({x2:g}, {y2:g})",
                    "",
                    f"Line Equation:        {res['equation']}",
                    f"Distance P1-P2:        {res['distance']:.8g}",
                    f"Midpoint:             ({res['midpoint'][0]:g}, {res['midpoint'][1]:g})",
                    f"Slope m:              {res['slope'] if isinstance(res['slope'], str) else f'{res[\"slope\"]:.8g}'}",
                    f"Perpendicular Slope:  {res['perpendicular_slope'] if isinstance(res['perpendicular_slope'], str) else f'{res[\"perpendicular_slope\"]:.8g}'}",
                    f"Angle deg:            {res['angle_deg']:.4f}°"
                ]
                res_str = res['equation']
                summary_expr = f"Line P1({x1},{y1}) P2({x2},{y2})"

            elif idx == 4:  # Vectors
                v_dim = self.vec_dim.currentIndex()
                ux, uy = float(self.vec_ux.text()), float(self.vec_uy.text())
                vx, vy = float(self.vec_vx.text()), float(self.vec_vy.text())

                if v_dim == 0:  # 2D Vectors
                    res = self.engine.analyze_vectors_2d(ux, uy, vx, vy)
                    out = [
                        f"=== 2D VECTOR ALGEBRA ===",
                        f"Vector u = ({ux:g}, {uy:g}), Vector v = ({vx:g}, {vy:g})",
                        "",
                        f"Magnitude |u|:    {res['magnitude_u']:.8g}",
                        f"Magnitude |v|:    {res['magnitude_v']:.8g}",
                        f"Dot Product u·v:  {res['dot_product']:.8g}",
                        f"Angle θ:          {res['angle_deg']:.4f}° ({res['angle_rad']:.6f} rad)",
                        f"Projection u on v:({res['projection_u_on_v'][0]:.6g}, {res['projection_u_on_v'][1]:.6g})"
                    ]
                    res_str = f"u·v = {res['dot_product']:.4f}"
                    summary_expr = f"Vector 2D: u=({ux},{uy}), v=({vx},{vy})"
                else:  # 3D Vectors
                    uz = float(self.vec_uz.text())
                    vz = float(self.vec_vz.text())
                    res = self.engine.analyze_vectors_3d(ux, uy, uz, vx, vy, vz)
                    out = [
                        f"=== 3D VECTOR ALGEBRA ===",
                        f"Vector u = ({ux:g}, {uy:g}, {uz:g}), Vector v = ({vx:g}, {vy:g}, {vz:g})",
                        "",
                        f"Magnitude |u|:       {res['magnitude_u']:.8g}",
                        f"Magnitude |v|:       {res['magnitude_v']:.8g}",
                        f"Dot Product u·v:     {res['dot_product']:.8g}",
                        f"Cross Product u×v:   ({res['cross_product'][0]:.6g}, {res['cross_product'][1]:.6g}, {res['cross_product'][2]:.6g})",
                        f"Angle θ:             {res['angle_deg']:.4f}° ({res['angle_rad']:.6f} rad)"
                    ]
                    res_str = f"u·v = {res['dot_product']:.4f}"
                    summary_expr = f"Vector 3D: u=({ux},{uy},{uz}), v=({vx},{vy},{vz})"

            result_text = "\n".join(out)
            self.output.setText(result_text)
            get_history_manager().add_entry(summary_expr, res_str)

        except Exception as e:
            self.output.setText(f"Error computing geometry / vectors: {e}")
