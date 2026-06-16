# 🚦 ParkWatch AI
### Illegal Parking Hotspot Intelligence & Enforcement Optimization Platform

ParkWatch AI is a smart-city intelligence platform designed to transform raw parking violation records into actionable enforcement insights.

Instead of simply displaying violations, the system:

- Detects illegal parking hotspots
- Identifies recurring violation patterns
- Estimates congestion impact caused by parking violations
- Generates explainable risk scores
- Recommends enforcement actions
- Provides operational dashboards for traffic authorities

---

## 🎯 Problem Statement

Illegal parking is a major contributor to urban congestion, emergency response delays, and inefficient road utilization.

Traffic authorities often rely on reactive enforcement, leading to delayed interventions and recurring violations.

ParkWatch AI enables authorities to:

- Identify high-risk locations
- Understand when violations occur most frequently
- Estimate congestion impact
- Prioritize enforcement resources
- Take proactive actions instead of reactive responses

---

## ✨ Key Features

### 📍 Hotspot Detection
- Geospatial clustering using DBSCAN
- Heatmap generation
- Hotspot ranking

### 📊 Analytics Dashboard
- Violation trends
- Peak violation hours
- Vehicle type distribution
- Police station workload analysis

### ⚠️ Risk Scoring Engine
Explainable risk score based on:

- Violation density
- Repeat violations
- Offence severity
- Peak hour occurrence
- Enforcement delays
- Location sensitivity

### 🚗 Congestion Impact Estimation
Estimates congestion severity using:

- Violation frequency
- Vehicle obstruction weight
- Peak-hour density
- Hotspot recurrence
- Violation duration

### 🎯 Enforcement Recommendation Engine
Provides actionable recommendations such as:

- Routine Patrol
- Peak Hour Enforcement
- Tow-Away Zones
- Camera Monitoring
- Signage Improvements
- Repeat Offender Actions

### 🗺️ Interactive Map
- Heatmaps
- Hotspot visualization
- Risk-based color coding
- Junction-level insights

---

## 🏗️ System Architecture

```text
CSV Dataset
      │
      ▼
Data Cleaning & Validation
      │
      ▼
Feature Engineering
      │
      ▼
Hotspot Detection (DBSCAN)
      │
      ▼
Risk Score Engine
      │
      ▼
Congestion Impact Engine
      │
      ▼
Recommendation Engine
      │
      ▼
FastAPI Backend
      │
      ▼
Next.js Frontend
```

---

## 🛠️ Tech Stack

### Frontend
- Next.js
- JavaScript
- Tailwind CSS
- shadcn/ui
- React Leaflet
- Recharts

### Backend
- FastAPI
- Python

### Database
- MySQL

### Data Processing
- Pandas
- NumPy
- Scikit-Learn

### Geospatial Analytics
- DBSCAN
- GeoPandas
- Folium / Leaflet

---

## 📂 Project Structure

```text
ParkWatch-AI/
│
├── backend/
│   ├── app/
│   ├── preprocess.py
│   ├── feature_engineering.py
│   ├── hotspot_detection.py
│   ├── risk_engine.py
│   ├── congestion_engine.py
│   ├── recommendation_engine.py
│   ├── seed_db.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── package.json
│
└── README.md
```

---

## 🚀 Running the Project

# 🚀 ParkWatch AI - Run Instructions

## Prerequisites

Install:

- Python 3.10+
- Node.js 18+
- MySQL
- npm

---

# Backend Setup

Open the project in VS Code (or any IDE).

Navigate to the backend folder.

---

## Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 2: Run Main Setup Script

```bash
python main.py
```

---

## Step 3: Seed Database

```bash
python seed_db.py
```

---

## Step 4: Start FastAPI Server

```bash
uvicorn app.main:app --reload --port 8080
```

Backend will be available at:

```text
http://localhost:8080
```

API Docs:

```text
http://localhost:8080/docs
```

---

# Frontend Setup

Open a new PowerShell / Terminal.

Navigate to frontend directory:

```bash
cd frontend
```

---

## Step 1: Install Dependencies

```bash
npm install --legacy-peer-deps
```

---

## Step 2: Start Frontend

```bash
npm run dev
```

Frontend will be available at:

```text
http://localhost:3000
```

---

# Application Flow

```text
MySQL Database
       │
       ▼
 FastAPI Backend
       │
       ▼
 Next.js Frontend
       │
       ▼
 User Dashboard
```

---

# Troubleshooting

## Port Already In Use

Change FastAPI port:

```bash
uvicorn app.main:app --reload --port 8081
```

or stop the existing process.

---

## Missing Packages

Reinstall dependencies:

```bash
pip install -r requirements.txt
```

and

```bash
npm install --legacy-peer-deps
```

---

## API Not Connecting

Verify backend is running:

```text
http://localhost:8080/docs
```

If the API docs page opens, the backend is working correctly.

---

# You're Ready 🎉

Open:

```text
http://localhost:3000
```

and start exploring ParkWatch AI.

---

## 📈 Future Scope

- Real-time CCTV integration
- Live traffic feeds
- Predictive hotspot forecasting
- Mobile enforcement application
- Smart patrol route optimization
- AI-powered congestion prediction

---

## 👥 Team
- Darshit Agarwal
- Yatish Singhal
- Yashasvi Saini
- Harshit Singh

---

## 🏆 Impact

ParkWatch AI helps authorities move from:

Reactive Enforcement ➜ Predictive Enforcement

Raw Violation Records ➜ Actionable Intelligence

Traffic Monitoring ➜ Smart Urban Mobility Management
