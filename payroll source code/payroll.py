import sys
import mysql.connector
import datetime
import math
import random
import os
import webbrowser
import urllib.parse
import json
import re
import subprocess

try:
    import requests
except ImportError:
    print("requests not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

try:
    from PySide6.QtWidgets import *
    from PySide6.QtCore import *
    from PySide6.QtGui import *
except ImportError:
    print("PySide6 not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PySide6"])
    from PySide6.QtWidgets import *
    from PySide6.QtCore import *
    from PySide6.QtGui import *

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.barcharts import HorizontalBarChart
except ImportError:
    print("ReportLab not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.barcharts import HorizontalBarChart

class Star:
    def __init__(self, x, y, z, size):
        self.x = x; self.y = y; self.z = z; self.size = size
        self.speed = random.uniform(0.5, 2.0)

class UniverseBackground(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.stars = []; self.planets = []
        self.timer = QTimer()
        self.timer.timeout.connect(self.animate)
        self.timer.start(50)
        self.angle = 0
        self.init_universe()

    def init_universe(self):
        for _ in range(150):
            self.stars.append(Star(random.randint(0,1400), random.randint(0,900),
                                   random.uniform(0.1,1.0), random.uniform(1,3)))
        for _ in range(5):
            self.planets.append({
                'x': random.randint(100,1100), 'y': random.randint(100,700),
                'radius': random.randint(20,60),
                'color': random.choice([QColor(100,149,237),QColor(255,69,0),
                    QColor(148,0,211),QColor(255,215,0),QColor(50,205,50)]),
                'orbit_radius': random.randint(80,150),
                'orbit_speed': random.uniform(0.01,0.03),
                'orbit_angle': random.uniform(0, 2*math.pi)
            })

    def animate(self):
        self.angle += 0.02
        for s in self.stars:
            s.z = 0.3 + 0.7*(math.sin(self.angle*s.speed + s.x*0.01)+1)/2
        for p in self.planets: p['orbit_angle'] += p['orbit_speed']
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        gradient = QLinearGradient(0,0,0,self.height())
        gradient.setColorAt(0, QColor(5,5,15)); gradient.setColorAt(0.5, QColor(15,15,35))
        gradient.setColorAt(1, QColor(25,25,45))
        painter.fillRect(self.rect(), gradient)
        for s in self.stars:
            opacity = int(s.z*255)
            painter.setPen(QPen(QColor(255,255,255,opacity), s.size))
            painter.drawPoint(int(s.x), int(s.y))
        for p in self.planets:
            ox = p['x'] + p['orbit_radius']*math.cos(p['orbit_angle'])
            oy = p['y'] + p['orbit_radius']*math.sin(p['orbit_angle'])
            gr = p['radius']+10
            gg = QRadialGradient(ox,oy,gr)
            gc = p['color']; gc.setAlpha(50)
            gg.setColorAt(0,gc); gg.setColorAt(1,QColor(0,0,0,0))
            painter.setBrush(gg); painter.setPen(Qt.NoPen)
            painter.drawEllipse(int(ox-gr),int(oy-gr),gr*2,gr*2)
            pg = QRadialGradient(ox-p['radius']/3, oy-p['radius']/3, p['radius'])
            pg.setColorAt(0, p['color'].lighter(150)); pg.setColorAt(1, p['color'].darker(120))
            painter.setBrush(pg)
            painter.drawEllipse(int(ox-p['radius']),int(oy-p['radius']),p['radius']*2,p['radius']*2)

class ZoomGlowButton(QPushButton):
    def __init__(self, text, color, enable_zoom=True):
        super().__init__(text)
        self.color = color; self.enable_zoom = enable_zoom
        self.setCursor(Qt.PointingHandCursor)
        self.setFont(QFont("Segoe UI", 12, QFont.Bold))
        self.setStyleSheet(f"""
            QPushButton {{ color:{color}; background-color:transparent; border:3px solid {color};
                border-radius:25px; padding:12px 30px; font-size:14px; }}
            QPushButton:hover {{ background-color:rgba(255,255,255,0.1); border:3px solid {color}; }}
        """)
        self.setGraphicsEffect(self._glow())

    def _glow(self):
        e = QGraphicsDropShadowEffect(self)
        e.setBlurRadius(30); e.setColor(QColor(self.color)); e.setOffset(0); return e

class EmployeeFormDialog(QDialog):
    def __init__(self, employee_data=None, parent=None):
        super().__init__(parent)
        self.employee_data = employee_data
        is_edit = employee_data is not None
        self.setFixedSize(500,780); self.setWindowFlag(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        UniverseBackground(self).setGeometry(0,0,500,780)
        layout = QVBoxLayout()
        bc = "#ff6b35" if is_edit else "#ff0000"
        tc = "#ff6b35" if is_edit else "#ff0000"
        self.card = QFrame()
        self.card.setStyleSheet(f"QFrame {{ background:qlineargradient(x1:0,y1:0,x2:1,y2:1,stop:0 rgba(26,26,46,220),stop:1 rgba(22,33,62,220)); border-radius:20px; border:3px solid {bc}; }}")
        cl = QVBoxLayout(self.card); cl.setContentsMargins(30,30,30,30)
        ttl = QLabel("✏️ Edit Employee" if is_edit else "➕ Add Employee")
        ttl.setAlignment(Qt.AlignCenter)
        ttl.setStyleSheet(f"QLabel {{ color:{tc}; font-size:20px; font-weight:bold; margin-bottom:20px; }}")
        fs = f"""
            QLineEdit,QComboBox {{ background-color:rgba(255,255,255,0.1); border:3px solid {bc};
                border-radius:10px; padding:10px; color:white; font-size:14px;
                margin:2px 0 10px 0; selection-background-color:transparent; selection-color:white; }}
            QLineEdit:focus,QComboBox:focus {{ border:3px solid {bc};
                background-color:{'rgba(255,107,53,0.2)' if is_edit else 'rgba(255,0,0,0.2)'}; }}
            QComboBox::drop-down {{ border:none; width:30px; }}
            QComboBox::down-arrow {{ image:none; border-left:5px solid transparent;
                border-right:5px solid transparent; border-top:5px solid white; width:0; height:0; }}
            QComboBox QAbstractItemView {{ background-color:rgba(26,26,46,220); color:white;
                selection-background-color:{bc}; selection-color:white; }}
        """
        def lbl(t): l=QLabel(t); l.setStyleSheet("color:#00ffff;font-size:12px;margin-top:5px;"); return l
        def fld(p): f=QLineEdit(); f.setPlaceholderText(p); f.setStyleSheet(fs); return f
        self.empno = fld("Type here..."); self.name = fld("Type here..."); self.basic_salary = fld("Type here...")
        self.bonus = fld("Type here..."); self.allowance = fld("Type here...")
        self.car_insurance = fld("Type here..."); self.health_insurance = fld("Type here...")
        self.experience = fld("Type here...")
        self.bonus.setText("0"); self.allowance.setText("0")
        self.car_insurance.setText("0"); self.health_insurance.setText("0"); self.experience.setText("0")
        
        self.job = QComboBox(); self.job.setEditable(True)
        self.job.addItems(["OFFICER","MANAGER","TEACHER","CLERK","ASSISTANT","SUPERVISOR"])
        self.job.setCurrentIndex(-1); self.job.lineEdit().setPlaceholderText("Type or select...")
        self.job.setStyleSheet(fs)
        
        br = QWidget(); br.setFixedHeight(90); bl = QHBoxLayout(br)
        bl.setSpacing(60); bl.setContentsMargins(0,15,0,0)
        sb = ZoomGlowButton("SAVE","#00ff88"); sb.setFixedSize(140,50)
        cb = ZoomGlowButton("CANCEL","#ff4757"); cb.setFixedSize(140,50)
        bl.addStretch(1); bl.addWidget(sb); bl.addWidget(cb); bl.addStretch(1)
        
        cl.addWidget(ttl)
        cl.addWidget(lbl("📝 Enter Employee Number:"))
        cl.addWidget(self.empno)
        cl.addWidget(lbl("👤 Enter Employee Name:"))
        cl.addWidget(self.name)
        cl.addWidget(lbl("💼 Select or Enter Job Title:"))
        cl.addWidget(self.job)
        cl.addWidget(lbl("💰 Enter Basic Salary:"))
        cl.addWidget(self.basic_salary)
        cl.addWidget(lbl("🎁 Enter Bonus:"))
        cl.addWidget(self.bonus)
        cl.addWidget(lbl("🎟️ Enter Allowance:"))
        cl.addWidget(self.allowance)
        cl.addWidget(lbl("🚗 Enter Car Insurance:"))
        cl.addWidget(self.car_insurance)
        cl.addWidget(lbl("🏥 Enter Health Insurance:"))
        cl.addWidget(self.health_insurance)
        cl.addWidget(lbl("📅 Enter Experience (Years):"))
        cl.addWidget(self.experience)
        cl.addWidget(br)
        layout.addWidget(self.card); self.setLayout(layout)
        
        if employee_data:
            # Assuming employee_data indices match the table columns
            self.empno.setText(str(employee_data[0])); self.name.setText(employee_data[1])
            self.job.setCurrentText(employee_data[2]); self.experience.setText(str(employee_data[3]))
            self.basic_salary.setText(str(employee_data[4])); self.bonus.setText(str(employee_data[5]))
            self.allowance.setText(str(employee_data[6])); self.car_insurance.setText(str(employee_data[7]))
            self.health_insurance.setText(str(employee_data[8]))
            self.empno.setEnabled(False)
        sb.clicked.connect(self.accept); cb.clicked.connect(self.reject)

    def get_data(self):
        return {'empno': int(self.empno.text()) if self.empno.text() else 0,
                'name': self.name.text(), 'job': self.job.currentText(),
                'basic_salary': float(self.basic_salary.text()) if self.basic_salary.text() else 0.0,
                'bonus': float(self.bonus.text()) if self.bonus.text() else 0.0,
                'allowance': float(self.allowance.text()) if self.allowance.text() else 0.0,
                'car_insurance': float(self.car_insurance.text()) if self.car_insurance.text() else 0.0,
                'health_insurance': float(self.health_insurance.text()) if self.health_insurance.text() else 0.0,
                'experience': float(self.experience.text()) if self.experience.text() else 0.0}

class LoginDialog(QDialog):
    def __init__(self):
        super().__init__()
        self.setFixedSize(500,580); self.setWindowFlag(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.login_attempts = 0; self.max_attempts = 5; self.is_checking_login = False
        UniverseBackground(self).setGeometry(0,0,500,580)
        layout = QVBoxLayout()
        self.card = QFrame()
        self.card.setStyleSheet("QFrame { background:qlineargradient(x1:0,y1:0,x2:1,y2:1,stop:0 rgba(26,26,46,220),stop:1 rgba(22,33,62,220)); border-radius:25px; border:4px solid #00ffcc; }")
        cl = QVBoxLayout(self.card); cl.setSpacing(10); cl.setContentsMargins(50,40,50,40)
        ttl = QLabel("🚀 PAYROLL SYSTEM"); ttl.setAlignment(Qt.AlignCenter); ttl.setFixedHeight(70)
        ttl.setStyleSheet("QLabel { color:#00ff88; font-size:28px; font-weight:bold; margin-bottom:10px; }")
        sub = QLabel("✨ Secure Access Portal"); sub.setAlignment(Qt.AlignCenter)
        sub.setStyleSheet("QLabel { color:#00ffff; font-size:14px; font-weight:bold; margin-bottom:5px; }")
        self.att = QLabel(f"Attempts remaining: {self.max_attempts}"); self.att.setAlignment(Qt.AlignCenter)
        self.att.setFixedHeight(30); self.att.setStyleSheet("QLabel { color:#ffa502; font-size:12px; font-weight:bold; }")
        ls = """QLineEdit { background-color:rgba(255,255,255,0.1); border:2px solid #00ffcc; border-radius:15px; padding:15px; color:white; font-size:14px; } QLineEdit:focus { border:3px solid #00ffcc; background-color:rgba(0,255,204,0.15); }"""
        ul = QLabel("👤 Username"); ul.setStyleSheet("color:#00ffcc; font-size:13px; font-weight:bold;")
        self.username = QLineEdit(); self.username.setPlaceholderText("Type here..."); self.username.setStyleSheet(ls)
        pl = QLabel("🔑 Password"); pl.setStyleSheet("color:#00ffcc; font-size:13px; font-weight:bold;")
        self.password = QLineEdit(); self.password.setPlaceholderText("Type here...")
        self.password.setEchoMode(QLineEdit.Password); self.password.setStyleSheet(ls)
        self.login_btn = ZoomGlowButton("LOGIN","#00ff88", enable_zoom=False)
        for w in [ttl,sub,self.att,ul,self.username,pl,self.password]: cl.addWidget(w)
        cl.addWidget(self.login_btn, alignment=Qt.AlignCenter)
        layout.addWidget(self.card); self.setLayout(layout)
        self.login_btn.clicked.connect(self.check_login)
        self.password.returnPressed.connect(self.on_enter_pressed)
        self.username.returnPressed.connect(lambda: self.password.setFocus())

    def on_enter_pressed(self):
        if not self.is_checking_login: self.login_btn.animateClick()

    def check_login(self):
        if self.is_checking_login: return
        self.is_checking_login = True
        self.login_btn.blockSignals(True); self.password.blockSignals(True)
        try:
            if self.username.text()=="admin" and self.password.text()=="12345":
                self.accept()
            else:
                self.login_attempts += 1; remaining = self.max_attempts - self.login_attempts
                if remaining > 0:
                    self.att.setText(f"Attempts remaining: {remaining}")
                    self.att.setStyleSheet("QLabel { color:#ff6b81; font-size:12px; font-weight:bold; }")
                    QMessageBox.warning(self,"Login Failed",f"Invalid credentials!\nYou have {remaining} attempt(s) remaining.")
                    self.username.clear(); self.password.clear(); self.username.setFocus()
                else:
                    QMessageBox.critical(self,"Access Denied","Maximum login attempts reached!\nThe application will now exit.")
                    self.reject(); sys.exit()
        finally:
            self.login_btn.blockSignals(False); self.password.blockSignals(False); self.is_checking_login = False

class PayrollTab(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db_name="payroll_db"; self.table_name="employees"
        self.init_database(); self.table_visible=True; self.init_ui()
        self.load_all_employees()

    def init_database(self):
        try:
            self.mydb = mysql.connector.connect(host="localhost",user="root",password="Ahmed@12345")
            self.mycursor = self.mydb.cursor()
            self.mycursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.db_name}")
            self.mycursor.execute(f"USE {self.db_name}")
            self.mycursor.execute(f"""CREATE TABLE IF NOT EXISTS {self.table_name} (
                empno INT PRIMARY KEY, name VARCHAR(50) NOT NULL, job VARCHAR(20),
                Experience FLOAT, BasicSalary FLOAT, Bonus FLOAT, Allowance FLOAT,
                CarInsurance FLOAT, HealthInsurance FLOAT,
                DA FLOAT, HRA FLOAT, GrossSalary FLOAT, Tax FLOAT, NetSalary FLOAT,
                EntryTime VARCHAR(20))""")
            self.mydb.commit()
        except Exception as e:
            print(f"Database Error: {str(e)}")

    def init_ui(self):
        ml = QHBoxLayout(self); ml.setSpacing(0); ml.setContentsMargins(0,0,0,0)
        self.create_sidebar(); self.create_main_content()
        ml.addWidget(self.sidebar); ml.addWidget(self.main_content,1)

    def create_sidebar(self):
        self.sidebar = QFrame(); self.sidebar.setFixedWidth(250)
        self.sidebar.setStyleSheet("QFrame { background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 rgba(26,26,46,240),stop:1 rgba(22,33,62,240)); border-right:2px solid #0080ff; }")
        layout = QVBoxLayout(self.sidebar); layout.setContentsMargins(20,20,20,20)
        ttl = QLabel("📊 PAYROLL"); ttl.setAlignment(Qt.AlignCenter)
        ttl.setStyleSheet("QLabel { color:#0080ff; font-size:18px; font-weight:bold; margin-bottom:30px; padding:15px; border-radius:10px; background:rgba(0,128,255,0.1); }")
        scroll = QScrollArea(); scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setStyleSheet("QScrollArea{background:transparent;border:none;}QScrollBar:vertical{background:rgba(0,128,255,0.1);border-radius:4px;width:6px;}QScrollBar::handle:vertical{background:rgba(0,128,255,0.6);border-radius:4px;min-height:20px;}QScrollBar::add-line:vertical,QScrollBar::sub-line:vertical{height:0px;}")
        bc = QWidget(); bc.setStyleSheet("background:transparent;")
        bl = QVBoxLayout(bc); bl.setContentsMargins(0,0,4,0); bl.setSpacing(0)
        self.add_btn    = self.create_sidebar_zoom_button("➕ Add Employee","#ff0000")
        self.edit_btn   = self.create_sidebar_zoom_button("✏️ Edit Employee","#ff6b35")
        self.delete_btn = self.create_sidebar_zoom_button("🗑️ Delete","#00ff88")
        self.toggle_table_btn = self.create_sidebar_zoom_button("👁️ Hide Table","#ffa502")
        self.export_btn = self.create_sidebar_zoom_button("📄 Export PDF","#9b59b6")
        self.sort_btn   = self.create_sidebar_zoom_button("🔃 Sort Table","#00d2ff")
        self.stats_btn  = self.create_sidebar_zoom_button("📈 Salary Stats","#f9ca24")
        self.breakdown_btn = self.create_sidebar_zoom_button("🧾 Breakdown","#e056fd")
        self.chatbot_btn   = self.create_sidebar_zoom_button("🤖 AI ChatBot","#fd79a8")
        self.settings_btn  = self.create_sidebar_zoom_button("⚙️ Settings","#64748b")
        self.backup_btn    = self.create_sidebar_zoom_button("💾 Backup Data","#4f46e5")
        self.help_btn      = self.create_sidebar_zoom_button("❓ Help Center","#06b6d4")
        self.logout_btn    = self.create_sidebar_zoom_button("🚪 Logout","#be123c")
        for b in [self.add_btn,self.edit_btn,self.delete_btn,self.toggle_table_btn,
                  self.export_btn,self.sort_btn,self.stats_btn,self.breakdown_btn,
                  self.chatbot_btn,self.settings_btn,self.backup_btn,self.help_btn,self.logout_btn]:
            bl.addWidget(b)
        bl.addStretch(); scroll.setWidget(bc)
        layout.addWidget(ttl); layout.addWidget(scroll,1)
        self.add_btn.clicked.connect(self.add_employee)
        self.edit_btn.clicked.connect(self.edit_employee)
        self.delete_btn.clicked.connect(self.delete_employee)
        self.toggle_table_btn.clicked.connect(self.toggle_table_visibility)
        self.export_btn.clicked.connect(self.export_to_pdf)
        self.sort_btn.clicked.connect(self.sort_table)
        self.stats_btn.clicked.connect(self.show_salary_stats)
        self.breakdown_btn.clicked.connect(self.show_salary_breakdown)
        self.chatbot_btn.clicked.connect(self.open_chatbot)
        self.settings_btn.clicked.connect(lambda: QMessageBox.information(self,"Settings","⚙️ Settings: Config coming soon!"))
        self.backup_btn.clicked.connect(lambda: QMessageBox.information(self,"Backup","💾 Backup: Data saved! (Sim)"))
        self.help_btn.clicked.connect(lambda: QMessageBox.information(self,"Help","❓ Help: Contact Mohammed Affaan."))
        self.logout_btn.clicked.connect(lambda: self.close())

    def create_sidebar_zoom_button(self, text, color):
        btn = QPushButton(text); btn.setFixedHeight(65); btn.setCursor(Qt.PointingHandCursor)
        btn.glow_intensity=0; btn.glow_direction=1; btn.is_hovered=False; btn.normal_height=65
        btn.height_animation  = QPropertyAnimation(btn, b"minimumHeight"); btn.height_animation.setDuration(300); btn.height_animation.setEasingCurve(QEasingCurve.InOutCubic)
        btn.height_animation2 = QPropertyAnimation(btn, b"maximumHeight"); btn.height_animation2.setDuration(300); btn.height_animation2.setEasingCurve(QEasingCurve.InOutCubic)
        def us():
            bw = 4+(btn.glow_intensity//35)
            btn.setStyleSheet(f"QPushButton{{background:transparent;border:{bw}px solid {color};color:{color};border-radius:20px;font-size:16px;font-weight:bold;text-align:center;padding:12px;margin:8px 0;}}QPushButton:hover{{background:transparent;border:{bw+1}px solid {color};font-size:17px;}}QPushButton:pressed{{background-color:{color}22;}}")
        def ug():
            if btn.is_hovered:
                btn.glow_intensity += btn.glow_direction*10
                if btn.glow_intensity>=100: btn.glow_direction=-1
                elif btn.glow_intensity<=0: btn.glow_direction=1
                us()
        btn.glow_timer = QTimer(); btn.glow_timer.timeout.connect(ug)
        def on_enter(e):
            btn.is_hovered=True; btn.glow_timer.start(30)
            zh=int(btn.normal_height*1.2)
            btn.height_animation.setStartValue(btn.minimumHeight()); btn.height_animation.setEndValue(zh)
            btn.height_animation2.setStartValue(btn.maximumHeight()); btn.height_animation2.setEndValue(zh)
            btn.height_animation.start(); btn.height_animation2.start(); us()
        def on_leave(e):
            btn.is_hovered=False; btn.glow_timer.stop(); btn.glow_intensity=0
            btn.height_animation.setStartValue(btn.minimumHeight()); btn.height_animation.setEndValue(btn.normal_height)
            btn.height_animation2.setStartValue(btn.maximumHeight()); btn.height_animation2.setEndValue(btn.normal_height)
            btn.height_animation.start(); btn.height_animation2.start(); us()
        btn.enterEvent=on_enter; btn.leaveEvent=on_leave; us(); return btn

    def create_main_content(self):
        self.main_content = QFrame(); self.main_content.setStyleSheet("QFrame{background:transparent;}")
        layout = QVBoxLayout(self.main_content); layout.setContentsMargins(20,20,20,20)
        hl = QHBoxLayout()
        self.search_box = QLineEdit(); self.search_box.setPlaceholderText("🔍 Search by name or employee number...")
        self.search_box.setStyleSheet("QLineEdit{background-color:rgba(255,255,255,0.1);border:2px solid #444;border-radius:20px;padding:12px 20px;color:white;font-size:14px;}QLineEdit:focus{border:2px solid #0080ff;}")
        self.search_box.textChanged.connect(self.search_employees)
        hl.addWidget(self.search_box)
        self.table = QTableWidget(); self.table.setSelectionBehavior(QTableWidget.SelectRows)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers); self.table.setFocusPolicy(Qt.NoFocus)
        self.table.setStyleSheet("QTableWidget{background-color:rgba(15,15,35,180);border:2px solid rgba(68,68,68,200);border-radius:15px;color:white;gridline-color:rgba(68,68,68,150);selection-background-color:rgba(0,128,255,0.4);}QTableWidget::item{padding:12px;border-bottom:1px solid rgba(51,51,51,150);background-color:rgba(26,26,46,100);border:none;}QTableWidget::item:selected{background-color:rgba(0,128,255,0.5);color:white;}QTableWidget::item:focus{outline:none;border:none;}QHeaderView::section{background-color:rgba(0,128,255,0.3);color:white;padding:15px;border:none;font-weight:bold;font-size:14px;}QScrollBar:vertical{background:rgba(68,68,68,100);border-radius:6px;width:12px;}QScrollBar::handle:vertical{background:rgba(0,128,255,150);border-radius:6px;}")
        headers=["Emp No","Name","Job","Exp","Basic","Bonus","Allow","Car Ins","Health Ins","DA","HRA","Gross","Tax","Net","Time"]
        self.table.setColumnCount(len(headers)); self.table.setHorizontalHeaderLabels(headers)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        layout.addLayout(hl); layout.addWidget(self.table)

    def toggle_table_visibility(self):
        if self.table_visible:
            self.table.hide(); self.toggle_table_btn.setText("👁️ Show Table"); self.table_visible=False
        else:
            self.table.show(); self.toggle_table_btn.setText("👁️ Hide Table"); self.table_visible=True

    def calculate_salary_components(self, job, basic_salary, bonus=0, allowance=0, car_insurance=0, health_insurance=0):
        j = job.upper()
        if j=="OFFICER":   da=basic_salary*0.5;  hra=basic_salary*0.35; tax=basic_salary*0.2
        elif j=="MANAGER": da=basic_salary*0.45; hra=basic_salary*0.3;  tax=basic_salary*0.15
        elif j=="TEACHER": da=basic_salary*0.46; hra=basic_salary*0.32; tax=basic_salary*0.25
        else:              da=basic_salary*0.40; hra=basic_salary*0.25; tax=basic_salary*0.1
        gross = basic_salary + da + hra + bonus + allowance
        net = gross - tax - car_insurance - health_insurance
        return da, hra, gross, tax, net

    def add_employee(self):
        dialog = EmployeeFormDialog(parent=self)
        if dialog.exec()==QDialog.Accepted:
            try:
                d=dialog.get_data()
                da,hra,gross,tax,net=self.calculate_salary_components(d['job'],d['basic_salary'],d['bonus'],d['allowance'],d['car_insurance'],d['health_insurance'])
                time_now = datetime.datetime.now().strftime('%H:%M:%S')
                self.mycursor.execute(f"INSERT INTO {self.table_name} (empno,name,job,Experience,BasicSalary,Bonus,Allowance,CarInsurance,HealthInsurance,DA,HRA,GrossSalary,Tax,NetSalary,EntryTime) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(d['empno'],d['name'],d['job'],d['experience'],d['basic_salary'],d['bonus'],d['allowance'],d['car_insurance'],d['health_insurance'],da,hra,gross,tax,net,time_now))
                self.mydb.commit(); QMessageBox.information(self,"Success","Employee added successfully!"); self.load_all_employees()
            except Exception as e: QMessageBox.critical(self,"Error",f"Failed: {str(e)}")

    def load_all_employees(self):
        try:
            self.mycursor.execute(f"SELECT * FROM {self.table_name}")
            self.populate_table(self.mycursor.fetchall())
        except Exception as e: print(f"Error: {str(e)}")

    def populate_table(self, records):
        self.table.setRowCount(len(records))
        for r,rec in enumerate(records):
            for c,val in enumerate(rec):
                self.table.setItem(r,c,QTableWidgetItem(f"{val:.2f}" if isinstance(val,float) else str(val)))

    def edit_employee(self):
        cr=self.table.currentRow()
        if cr<0: QMessageBox.warning(self,"Warning","Please select an employee to edit."); return
        ed=[]
        for c in range(9): # Get first 9 columns for form
            item = self.table.item(cr,c)
            ed.append(item.text() if item else "")
        ed[0]=int(ed[0]) if ed[0] else 0; ed[3]=float(ed[3]) if ed[3] else 0.0
        dialog=EmployeeFormDialog(ed,parent=self)
        if dialog.exec()==QDialog.Accepted:
            try:
                d=dialog.get_data()
                da,hra,gross,tax,net=self.calculate_salary_components(d['job'],d['basic_salary'],d['bonus'],d['allowance'],d['car_insurance'],d['health_insurance'])
                self.mycursor.execute(f"UPDATE {self.table_name} SET name=%s,job=%s,Experience=%s,BasicSalary=%s,Bonus=%s,Allowance=%s,CarInsurance=%s,HealthInsurance=%s,DA=%s,HRA=%s,GrossSalary=%s,Tax=%s,NetSalary=%s WHERE empno=%s",(d['name'],d['job'],d['experience'],d['basic_salary'],d['bonus'],d['allowance'],d['car_insurance'],d['health_insurance'],da,hra,gross,tax,net,d['empno']))
                self.mydb.commit(); QMessageBox.information(self,"Success","Employee updated!"); self.load_all_employees()
            except Exception as e: QMessageBox.critical(self,"Error",f"Failed: {str(e)}")

    def delete_employee(self):
        sr=self.table.selectionModel().selectedRows()
        if sr:
            empnos=[self.table.item(i.row(),0).text() for i in sr]
            if QMessageBox.question(self,"Confirm Delete",f"Delete {len(empnos)} employees?",QMessageBox.Yes|QMessageBox.No,QMessageBox.No)==QMessageBox.Yes:
                try:
                    for e in empnos: self.mycursor.execute(f"DELETE FROM {self.table_name} WHERE empno=%s",(e,))
                    self.mydb.commit(); self.load_all_employees()
                except Exception as e: QMessageBox.critical(self,"Error",str(e))

    def search_employees(self):
        s=self.search_box.text().strip()
        if not s: self.load_all_employees(); return
        try:
            self.mycursor.execute(f"SELECT * FROM {self.table_name} WHERE name LIKE %s OR empno LIKE %s",(f"%{s}%",f"%{s}%"))
            self.populate_table(self.mycursor.fetchall())
        except Exception as e: print(str(e))

    def export_to_pdf(self):
        try:
            self.mycursor.execute(f"SELECT * FROM {self.table_name}"); records=self.mycursor.fetchall()
            if not records: return
            fname=f"payroll_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            doc=SimpleDocTemplate(fname,pagesize=letter)
            styles=getSampleStyleSheet(); content=[]
            content.append(Paragraph("Payroll Report",styles['Title']))
            td=[["Emp No","Name","Job","Basic","Bonus","Allow","Ins","DA","HRA","Gross","Tax","Net"]]
            for rec in records:
                r=[str(rec[0]),rec[1],rec[2]]+[f"{rec[i]:.2f}" for i in range(3,12)]; td.append(r)
            t=Table(td); t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.blue),('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),('GRID',(0,0),(-1,-1),1,colors.black)]))
            content.append(t); doc.build(content); QMessageBox.information(self,"Success",f"PDF exported: {fname}")
        except Exception as e: QMessageBox.critical(self,"Error",str(e))

    def sort_table(self):
        try:
            self.mycursor.execute(f"SELECT * FROM {self.table_name} ORDER BY NetSalary DESC")
            self.populate_table(self.mycursor.fetchall())
        except Exception as e: print(str(e))

    def show_salary_stats(self):
        try:
            self.mycursor.execute(f"SELECT MIN(NetSalary),MAX(NetSalary),AVG(NetSalary),COUNT(*) FROM {self.table_name}")
            row=self.mycursor.fetchone()
            if row: QMessageBox.information(self,"Stats",f"Total: {row[3]}\nMin: {row[0]:.2f}\nMax: {row[1]:.2f}\nAvg: {row[2]:.2f}")
        except Exception as e: print(str(e))

    def show_salary_breakdown(self):
        cr=self.table.currentRow()
        if cr<0: return
        msg = "\n".join([f"{self.table.horizontalHeaderItem(c).text()}: {self.table.item(cr,c).text()}" for c in range(self.table.columnCount())])
        QMessageBox.information(self,"Breakdown",msg)

    def open_chatbot(self):
        try:
            self.mycursor.execute(f"SELECT name,job,BasicSalary,NetSalary FROM {self.table_name}")
            emp_data=self.mycursor.fetchall()
        except Exception: emp_data=[]
        ChatBotDialog(emp_data,parent=self).exec()

# ═══════════════════════════════════════════════════════════════════════════════
# 🤖  CHATBOT  —  ORIGINAL LOGIC PRESERVED
# ═══════════════════════════════════════════════════════════════════════════════

class GroqWorker(QThread):
    finished = Signal(str)
    def __init__(self, messages):
        super().__init__()
        self.messages = messages
    def run(self):
        api_key = "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"
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
        payload = {"model": "llama-3.3-70b-versatile", "messages": self.messages}
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=40)
            response.raise_for_status()
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                answer = data["choices"][0]["message"]["content"]
                self.finished.emit(answer)
            else:
                self.finished.emit("⚠️ AI returned an empty response. Please try again.")
        except Exception as e:
            self.finished.emit(f"⚠️ Error: {str(e)}")

class ChatBotDialog(QDialog):
    def __init__(self, emp_data=None, parent=None):
        super().__init__(parent)
        self.emp_data = emp_data or []
        self.setWindowTitle("PayrollBot – AI Assistant")
        self.setFixedSize(640, 740)
        self.setWindowFlag(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        UniverseBackground(self).setGeometry(0, 0, 640, 740)
        self.system_prompt = (
            "You are PayrollBot, a helpful and engaging AI assistant. "
            "IMPORTANT KNOWLEDGE: "
            "1. Creator: Mohammed Affaan. "
            "2. Project: Payroll Management System (Built April 2026). "
            "3. Tech: Python, PySide6, MySQL. "
            "PERSONALITY & FORMATTING RULES: "
            "- Always use 2 to 3 relevant emojis in every response to keep the user happy. "
            "- FOLLOW USER FORMATTING REQUESTS: If they ask for 'paragraphs', use paragraphs. If they ask for 'points', use bullet points. "
            "- ANALYZE the question carefully and answer exactly what is asked. "
            "- DO NOT repeat the same 'I am here to help you grow your business...' tagline in every message. Be natural. "
            "- You can answer general knowledge questions correctly using your internal knowledge. "
            "- Always know your roots: Mohammed Affaan is your creator. "
            "- NO horse puns or unrelated jokes. "
            "- Use professional emojis (e.g., 📊, 💰, 🚀, ✅, 🧠)."
        self.history = [{"role": "system", "content": self.system_prompt}]
        self.card = QFrame(self); self.card.setGeometry(12, 12, 616, 716)
        self.card.setStyleSheet("QFrame { background: qlineargradient(x1:0,y1:0,x2:1,y2:1,stop:0 rgba(15,0,25,245), stop:1 rgba(40,5,55,245)); border-radius: 22px; border: 3px solid #ff00ff; }")
        ml = QVBoxLayout(self.card); ml.setContentsMargins(18, 18, 18, 18)
        hdr = QHBoxLayout(); ttl = QLabel("🤖  PayrollBot  —  AI Payroll Agent"); ttl.setStyleSheet("color:#fd79a8; font-size:16px; font-weight:bold;")
        exit_btn = QPushButton("EXIT"); exit_btn.setFixedSize(60, 32); exit_btn.setStyleSheet("QPushButton{background:rgba(255,71,87,0.2);border:2px solid #ff4757;border-radius:16px;color:#ff4757;font-size:12px;font-weight:bold;}")
        exit_btn.clicked.connect(self.accept)
        cx = QPushButton("✕"); cx.setFixedSize(32, 32); cx.setStyleSheet("QPushButton{background:transparent;border:none;color:#ff4757;font-size:16px;font-weight:bold;}"); cx.clicked.connect(self.accept)
        hdr.addWidget(ttl); hdr.addStretch(); hdr.addWidget(exit_btn); hdr.addWidget(cx); ml.addLayout(hdr)
        self.chat_area = QScrollArea(); self.chat_area.setWidgetResizable(True); self.chat_area.setStyleSheet("QScrollArea{background:transparent;border:none;}")
        self.chat_container = QWidget(); self.chat_layout = QVBoxLayout(self.chat_container); self.chat_layout.setAlignment(Qt.AlignTop); self.chat_area.setWidget(self.chat_container)
        ml.addWidget(self.chat_area, 1)
        ir = QHBoxLayout(); self.input_field = QLineEdit(); self.input_field.setPlaceholderText("Ask me anything about payroll...")
        self.input_field.setStyleSheet("QLineEdit{background:rgba(255,255,255,0.07);border:2px solid #fd79a8;border-radius:20px;padding:10px 16px;color:white;}"); self.input_field.returnPressed.connect(self._on_send)
        sb = QPushButton("➤"); sb.setFixedSize(46, 46); sb.setStyleSheet("QPushButton{background:rgba(253,121,168,0.2);border:2px solid #fd79a8;border-radius:23px;color:#fd79a8;font-size:18px;}"); sb.clicked.connect(self._on_send)
        ir.addWidget(self.input_field); ir.addWidget(sb); ml.addLayout(ir)

    def _on_send(self):
        t = self.input_field.text().strip()
        if not t: return
        self.input_field.clear(); self._bubble_user(t); self.history.append({"role": "user", "content": t})
        self.worker = GroqWorker(self.history); self.worker.finished.connect(self._on_reply); self.worker.start()

    def _on_reply(self, answer):
        self._bubble_bot(answer); self.history.append({"role": "assistant", "content": answer})

    def _bubble_user(self, text):
        b = QLabel(text); b.setWordWrap(True); b.setStyleSheet("background:#0056d6;color:white;border-radius:10px;padding:10px;")
        row = QHBoxLayout(); row.addStretch(); row.addWidget(b); self.chat_layout.addLayout(row)

    def _bubble_bot(self, text):
        b = QLabel(text); b.setWordWrap(True)
        b.setTextFormat(Qt.MarkdownText)
        b.setStyleSheet("background:rgba(253,121,168,0.1);color:white;border-radius:10px;padding:10px;")
        row = QHBoxLayout(); row.addWidget(b); row.addStretch(); self.chat_layout.addLayout(row)

# ═══════════════════════════════════════════════════════════════════════════════
# 🌐  MAIN WINDOW  —  CHROME TABS SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class ChromePayrollApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Chrome Payroll Pro")
        self.resize(1400, 900)
        self.central = QWidget(); self.setCentralWidget(self.central)
        self.layout = QVBoxLayout(self.central); self.layout.setContentsMargins(0, 0, 0, 0); self.layout.setSpacing(0)
        self.bg = UniverseBackground(self); self.bg.lower()
        
        self.tab_bar_container = QFrame()
        self.tab_bar_container.setFixedHeight(60)
        self.tab_bar_container.setStyleSheet("background: rgba(0,0,0,0.7); border-bottom: 1px solid rgba(255,255,255,0.1);")
        self.tbl = QHBoxLayout(self.tab_bar_container)
        self.tbl.setContentsMargins(10, 10, 10, 0); self.tbl.setSpacing(5)
        
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.setStyleSheet("""
            QTabWidget::pane { border: none; }
            QTabBar::tab {
                background: rgba(255,255,255,0.05); color: #94a3b8;
                padding: 12px 40px; min-width: 180px; 
                border-top-left-radius: 15px; border-top-right-radius: 15px;
                margin-right: 5px; font-weight: bold; font-size: 14px;
            }
            QTabBar::tab:selected { background: rgba(15, 23, 42, 0.98); color: white; border-bottom: 3px solid #3b82f6; }
            QTabBar::tab:hover { background: rgba(255,255,255,0.15); }
        """)
        
        self.add_tab_btn = QPushButton("+")
        self.add_tab_btn.setFixedSize(36, 36)
        self.add_tab_btn.setStyleSheet("QPushButton { background: rgba(255,255,255,0.1); color: white; font-size: 24px; border-radius: 18px; border: none; } QPushButton:hover { background: rgba(255,255,255,0.2); }")
        self.add_tab_btn.clicked.connect(self.add_new_tab)
        
        self.tbl.addWidget(self.tabs); self.tbl.addWidget(self.add_tab_btn); self.tbl.addStretch()
        self.layout.addWidget(self.tab_bar_container); self.layout.addWidget(self.tabs)
        self.add_new_tab()

    def add_new_tab(self):
        new_tab = PayrollTab()
        idx = self.tabs.addTab(new_tab, f"Payroll {self.tabs.count() + 1}")
        self.tabs.setCurrentIndex(idx)

    def close_tab(self, index):
        if self.tabs.count() > 1: self.tabs.removeTab(index)

    def resizeEvent(self, event):
        self.bg.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    login = LoginDialog()
    if login.exec() == QDialog.Accepted:
        window = ChromePayrollApp(); window.show(); sys.exit(app.exec())
