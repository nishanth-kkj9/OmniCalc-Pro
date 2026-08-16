from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton, QTableWidget, QTableWidgetItem, QHeaderView
from PySide6.QtCore import Qt
from core.history_manager import get_history_manager
from utils.helpers import copy_to_clipboard

class HistoryPage(QWidget):
    def __init__(self):
        super().__init__()
        self.db = get_history_manager()
        self.setup_ui()
        self.refresh()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        h = QHBoxLayout()
        self.search = QLineEdit()
        self.search.setPlaceholderText("Search history...")
        self.search.textChanged.connect(self.search_history)
        h.addWidget(self.search)
        
        btn = QPushButton("Clear All")
        btn.setObjectName("DangerBtn")
        btn.clicked.connect(self.clear_all)
        h.addWidget(btn)
        layout.addLayout(h)

        self.table = QTableWidget()
        self.table.setColumnCount(3)
        self.table.setHorizontalHeaderLabels(["Expression", "Result", "Timestamp"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.cellDoubleClicked.connect(self.copy_result)
        layout.addWidget(self.table)

    def refresh(self):
        self.table.setRowCount(0)
        rows = self.db.get_all()
        for i, row in enumerate(rows):
            self.table.insertRow(i)
            self.table.setItem(i, 0, QTableWidgetItem(row["expression"]))
            self.table.setItem(i, 1, QTableWidgetItem(row["result"]))
            self.table.setItem(i, 2, QTableWidgetItem(row["timestamp"]))

    def search_history(self, txt):
        rows = self.db.search(txt)
        self.table.setRowCount(0)
        for i, row in enumerate(rows):
            self.table.insertRow(i)
            self.table.setItem(i, 0, QTableWidgetItem(row["expression"]))
            self.table.setItem(i, 1, QTableWidgetItem(row["result"]))
            self.table.setItem(i, 2, QTableWidgetItem(row["timestamp"]))

    def clear_all(self):
        self.db.clear_all()
        self.refresh()

    def copy_result(self, row, col):
        copy_to_clipboard(self.table.item(row, col).text())