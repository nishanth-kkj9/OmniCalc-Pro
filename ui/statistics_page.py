from PySide6.QtWidgets import QWidget, QVBoxLayout, QLineEdit, QPushButton, QTextEdit
from core.statistics_engine import StatisticsEngine

class StatisticsPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = StatisticsEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        self.input = QLineEdit()
        self.input.setPlaceholderText("Comma separated numbers: 12,15,20,25")
        layout.addWidget(self.input)

        self.btn = QPushButton("Analyze")
        self.btn.setObjectName("OperatorBtn")
        self.btn.clicked.connect(self.analyze)
        layout.addWidget(self.btn)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)

    def analyze(self):
        try:
            raw_text = self.input.text()
            if not raw_text.strip():
                self.output.setText("Please enter comma-separated numbers.")
                return
                
            data = [float(x.strip()) for x in raw_text.split(",") if x.strip()]
            if not data:
                self.output.setText("Invalid data format.")
                return
                
            stats = self.engine.analyze(data)
            text = "\n".join([f"{k}: {v:.4f}" for k, v in stats.items()])
            self.output.setText(text)
        except Exception as e:
            self.output.setText(f"Error: {str(e)}")