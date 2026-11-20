# KAVAL – AI-Powered Household-Level Flood Intelligence & Disaster Response System

> *"Don't warn the city. Warn every doorstep."*

**Hackathon:** CipherCop 2026  
**Track:** AI for Disaster Resilience  
**Team:** The G.O.A.T.  
**Pilot Location:** Chennai, Tamil Nadu (Expandable to Mumbai, Patna, Cuttack)

---

## 1. Executive Summary

Traditional disaster management broadcasts generalized, city-wide warnings (e.g. *"Heavy rain expected across Chennai"*). These warnings fail because:
1. **Topography is hyper-local:** A resident living at an elevation of 2.1m in Ram Nagar (Velachery) faces 60cm of inundation, while a neighbor living 400m away on an elevated ridge remains completely dry.
2. **Vulnerability is not uniform:** A ground-floor household with a bedridden elder and two infants has vastly different evacuation needs than healthy young adults on the third floor.
3. **Road access is dynamic:** Evacuation routes that route citizens through low-lying canal causeways or flooded arterial underpasses lead citizens directly into danger.

**KAVAL** solves this by converting macro-scale meteorological predictions into **personalized, household-level evacuation decisions, verified safe bypass routing, and human-authorized multilingual alerts**.

---

## 2. System Architecture

KAVAL operates through three independent but tightly interconnected intelligence engines:

```
                     ┌──────────────────────────────────────────────┐
                     │            Open-Meteo & IMD Feeds           │
                     │          Copernicus DEM GLO-30 (30m)        │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌────────────────────────────────────────────────┐
                    │                    ENGINE 1                    │
                    │      SEER: Spatial Early-Warning & Risk        │
                    │  • Gradient Boosted Hydro Susceptibility Model │
                    │  • SCS-CN Runoff & Inundation Ponding Depth    │
                    │  • 30m Grid Susceptibility GeoJSON Polygons    │
                    └───────────────────────┬────────────────────────┘
                                            │
                    ┌───────────────────────▼────────────────────────┐
                    │                    ENGINE 2                    │
                    │   VULN: Household Vulnerability Network Layer  │
                    │  • Demographic & Physical Micro-Risk Scoring   │
                    │  • Mobility Constraints (Bedridden / Wheelchair)│
                    │  • Configurable Weights & Real-time Priority Q │
                    └───────────────────────┬────────────────────────┘
                                            │
                    ┌───────────────────────▼────────────────────────┐
                    │                    ENGINE 3                    │
                    │     DISPATCH: Action & Communications Engine   │
                    │  • Autonomous 8-Tool AI Decision Agent         │
                    │  • NetworkX Safe Escape Routing (Flood Avoid)  │
                    │  • Multilingual Grounded Alert Generator       │
                    │  • Human Officer Approval Gate (Sign-Off)      │
                    └───────────────────────┬────────────────────────┘
                                            │
                                            ▼
       ┌──────────────────────────────┬──────────────────────────────┐
       │                              │                              │
       ▼                              ▼                              ▼
┌──────────────┐             ┌─────────────────┐           ┌──────────────────┐
│  CENTRAL     │             │ RESPONDER FIELD │           │ CITIZEN MOBILE   │
│  COMMAND     │             │ RESCUE CONSOLE  │           │ SAFETY PORTAL    │
│  DASHBOARD   │             │ (SDRF Boats)    │           │ (SAFE / SOS)     │
└──────────────┘             └─────────────────┘           └──────────────────┘
```

### Engine 1: SEER (Spatial Early-warning and Environmental Risk)
- Ingests numerical precipitation forecasts from **Open-Meteo** and elevation data from **Copernicus DEM GLO-30**.
- Deploys a calibrated **Gradient Boosting Classifier** trained on regional hydrological features (Accuracy: 93.9%, ROC-AUC: 0.9826).
- Computes flood susceptibility probability and estimated standing water depth (cm) across 30-meter terrain cells.
- Integrates experimental **SCS-CN runoff** approximation and terrain drainage modeling.

### Engine 2: VULN (Vulnerability and Urgency Network Layer)
- Evaluates individual household vulnerability on a 0–100 scale using configurable multi-criteria weighting:
  - $\text{Flood Exposure}$ (SEER terrain intersection)
  - $\text{Mobility Limitations}$ (bedridden, wheelchair-dependent, slow mobility)
  - $\text{Demographics}$ (elderly count, children count, disability status)
  - $\text{Structural Exposure}$ (ground floor occupancy, building construction type)
  - $\text{Isolation}$ (distance to nearest accessible emergency shelter)
- Maintains an automated emergency priority queue for rescue deployment.

### Engine 3: DISPATCH (Disaster Intelligence and Personalised Action)
- A tool-using AI decision agent that orchestrates 8 backend tools:
  1. `get_household_risk(household_id)`
  2. `get_local_flood_conditions(latitude, longitude)`
  3. `get_nearest_shelters(latitude, longitude)`
  4. `calculate_safe_route(origin, destination)`
  5. `check_road_flood_risk(route_id)`
  6. `check_shelter_capacity(shelter_id)`
  7. `generate_evacuation_message(household_id, language)`
  8. `create_rescue_request(household_id)`
- Dynamically penalizes flooded or closed road segments via **NetworkX** graph routing to find safe escape corridors.
- Generates verified, actionable evacuation instructions in **English**, **Tamil (தமிழ்)**, and **Hindi (हिंदी)**.
- Enforces a mandatory **human-in-the-loop disaster officer authorization gate** before any notification is broadcast.

---

## 3. Step-by-Step Demonstration Workflow (For Judges)

The prototype is pre-configured to execute an end-to-end disaster response demonstration out of the box with zero external API keys required:

1. **Step 1 – Administrator Login & Pilot Selection:**
   Open the app at `http://localhost:5173`. Click **"Officer"** or **"Admin"** on the Judge Rapid Switcher bar in the top navigation. Observe the Chennai pilot area loaded with Velachery, Madipakkam, Mudichur, and Saidapet zones.
2. **Step 2 – SEER Weather & Hydrological Forecast:**
   Navigate to **SEER Flood Engine**. Review Open-Meteo precipitation feeds and adjust the **Rainfall Scenario Slider** from 140mm to 280mm. Click **"Simulate Flood Scenario"** to watch the hydro model recalculate susceptibility scores.
3. **Step 3 – Interactive Map Inspection:**
   On the **Command Dashboard**, inspect the interactive Chennai map. Click on any colored grid polygon to inspect its elevation, slope, distance to drainage, and estimated ponding depth.
4. **Step 4 – VULN Household Vulnerability Ranking:**
   Navigate to **VULN Households**. Notice 120 simulated doorsteps ranked by composite vulnerability score. Filter by neighbourhood (`Velachery`) and risk (`Critical`).
5. **Step 5 – Inspect Critical Doorstep Profile:**
   Click **"Breakdown"** on household `HH-CHE-001` (K. Ramanathan, bedridden resident, ground floor, 45cm inundation). Review the explanatory breakdown of why this household received a critical vulnerability rating.
6. **Step 6 – Launch DISPATCH AI Agent:**
   Click **"Run DISPATCH"**. The system navigates to the DISPATCH engine with `HH-CHE-001` selected.
7. **Step 7 – Tool Orchestration:**
   Click **"Run DISPATCH AI Agent"**. Observe the live execution trace as the autonomous agent executes all 8 tools in sequence.
8. **Step 8 – Safe Routing & Shelter Assignment:**
   Review the synthesized recommendation. The agent bypassed full or inaccessible shelters and selected *Guru Nanak College Relief Center*, while generating a safe escape corridor that detours around flooded Ram Nagar canals.
9. **Step 9 – Multilingual Alert Generation:**
   Toggle language tabs to view the generated grounded warning in **Tamil**, **English**, and **Hindi**, including clear reply codes (`1 – SAFE`, `2 – NEED HELP`).
10. **Step 10 – Officer Authorization Gate:**
    Click **"Review Sign-Off"**. As a Disaster Management Officer, review the preview and click **"Approve & Dispatch"**. The alert moves to `DISPATCHED` status in the official log.
11. **Step 11 – Citizen Experience Portal:**
    Click the **"Citizen"** button on the top judge switcher bar. The view switches to the citizen mobile portal for `HH-CHE-001`. The citizen sees their household risk, turn-by-turn safe escape steps, and nearest shelter. Click **"I AM SAFE"** or **"NEED HELP"**.
12. **Step 12 – Responder Console Synchronization:**
    Switch back to **Responder** or **Officer**. The priority queue updates the household's evacuation status in real time.

---

## 4. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Leaflet Maps, Recharts, React Router.
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, SQLite (instant local zero-dependency run) & PostgreSQL/PostGIS (Docker).
- **Machine Learning & Hydrology:** Scikit-learn (GradientBoostingClassifier), NumPy, Pandas, Joblib, NetworkX (Graph Routing), Shapely.
- **Containerization & Ops:** Docker, Docker Compose, Pytest, Pytest-Asyncio.

---

## 5. Quick Start Instructions (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- `uv` (recommended for ultra-fast Python package management) or standard `pip`

### 1. Clone & Set Up Python Environment
```bash
# Clone the repository
git clone https://github.com/the-goat-team/kaval.git
cd kaval

# Create virtual environment
uv venv .venv --python 3.11

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
uv pip install -r requirements.txt # or uv pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy aiosqlite scikit-learn numpy pandas joblib networkx httpx pyjwt bcrypt python-multipart pytest pytest-asyncio shapely
```

### 2. Seed Database & Train ML Model
```bash
# Train the SEER Gradient Boosted Hydrological Model
python ml/training/train_seer_model.py

# Initialize SQLite database and seed 120 demo households, shelters, roads, and grid cells
python backend/app/seed_data.py
```

### 3. Run Backend Server
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*FastAPI Swagger documentation is available at:* `http://127.0.0.1:8000/docs`

### 4. Run Frontend Application
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open your browser at:* `http://localhost:5173`

---

## 6. Running with Docker Compose

To run the complete full-stack environment with PostgreSQL, PostGIS, FastAPI, and Nginx:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- PostGIS Database: `localhost:5432`

---

## 7. Running Backend Automated Tests

KAVAL includes a comprehensive Pytest test suite covering SEER flood prediction, VULN scoring, multilingual alert formatting, safe route optimization, demo logins, and citizen portal endpoints:

```bash
# Run all tests
uv run pytest backend/tests/test_backend.py -v
```

---

## 8. Role-Based Access & Demo Credentials

For judging convenience, the top navigation bar includes an **instant 1-click Judge Role Switcher**. Pre-seeded credentials:

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Administrator** | `admin@kaval.gov.in` | `admin123` | System configuration, dataset uploads, model re-training |
| **Disaster Officer** | `officer@kaval.gov.in` | `officer123` | Alert approval gate sign-off, shelter occupancy management |
| **Field Responder** | `responder@kaval.gov.in` | `responder123` | Evacuation queue triage, status updates (`Safe`, `Rescue`) |
| **Citizen** | `citizen@kaval.gov.in` | `citizen123` | Mobile portal, safe confirmations, emergency SOS distress signals |

---

## 9. Model Transparency & Scientific Integrity

- **Model Name:** SEER Hybrid Flood Susceptibility Classifier
- **Algorithm:** GradientBoostingClassifier (scikit-learn ensemble)
- **Trained Metrics:**
  - Accuracy: **93.90%**
  - ROC-AUC: **0.9826**
  - F1-Score: **0.8310**
  - Precision: **89.20%**
  - Recall: **78.40%**
- **Feature Contribution:**
  - 24-Hour Rainfall Accumulation: **38.4%**
  - Digital Elevation (Copernicus DEM 30m): **28.1%**
  - Distance to River / Drainage Canal: **16.2%**
  - Soil Saturation Index: **9.8%**
  - Flow Accumulation Catchment: **5.2%**
  - Slope Gradient: **2.3%**
- **Known Limitations:** Trained on regional flat coastal terrain. Precipitation observations from coarse numerical models are downscaled with DEM; localized drainage clogs or culvert blockages require field responder verification.

---

## 10. Privacy & Synthetic Data Statement

In compliance with hackathon regulations and ethical data standards, **zero real citizen personal identification information (PII) is scraped or stored**. All 120 household records and resident profiles in the Chennai pilot are **synthetic records** generated using statistical distributions from WorldPop population estimates and OpenStreetMap building footprints.

---

## 11. Team Information

**Team Name:** The G.O.A.T.  
**Hackathon:** CipherCop 2026  
**Track:** AI for Disaster Resilience  
**Project:** KAVAL – Household-Level Flood Intelligence and Response System  
*"Don't warn the city. Warn every doorstep."*
