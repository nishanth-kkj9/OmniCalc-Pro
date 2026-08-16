from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QHBoxLayout, QGroupBox, QGridLayout
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

class DashboardPage(QWidget):
    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        main = QVBoxLayout(self)
        
        title = QLabel("Welcome to OmniCalc Pro", objectName="Title")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main.addWidget(title)

        subtitle = QLabel("All-in-One Advanced Calculator for Professionals", objectName="Subtitle")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main.addWidget(subtitle)

        grid = QGridLayout()
        widgets = [
            ("\U0001f4d0", "Scientific", "Complex math & functions"),
            ("\U0001f4c8", "Graph", "Plot equations visually"),
            ("\U0001f4b0", "Finance", "EMI, CI, GST, Discounts"),
            ("\U0001f4ca", "Statistics", "Mean, Mode, Std Dev, Variance")
        ]
        
        for i, (icon, t, d) in enumerate(widgets):
            card = QGroupBox()
            card.setStyleSheet("border: 1px solid #444; border-radius: 12px; padding: 15px; background: #222;")
            v = QVBoxLayout(card)
            
            lbl = QLabel(icon)
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            font = lbl.font()
            font.setPointSize(32)
            lbl.setFont(font)
            
            v.addWidget(lbl)
            
            lbl_title = QLabel(t, objectName="Title")
            lbl_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
            v.addWidget(lbl_title)
            
            lbl_sub = QLabel(d, objectName="Subtitle")
            lbl_sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
            v.addWidget(lbl_sub)
            
            row, col = divmod(i, 2)
            grid.addWidget(card, row, col)
            
        main.addLayout(grid)
        main.addStretch()