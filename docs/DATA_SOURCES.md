# KAVAL Data Sources & External Dataset Registry

**Project:** KAVAL – AI-Powered Household-Level Flood Intelligence and Disaster Response System  
**Track:** AI for Disaster Resilience | **Hackathon:** CipherCop 2026  
**Team:** The G.O.A.T.  

This document details all external datasets, APIs, and geospatial resources utilized by KAVAL's three intelligence engines (**SEER**, **VULN**, and **DISPATCH**), including download URLs, licenses, attribution requirements, and processing methods.

---

## 1. Open-Meteo Weather Forecast API
- **Engine:** SEER
- **Data Provided:** Hourly precipitation forecasts, rainfall accumulation, relative humidity, wind speed, atmospheric pressure.
- **Resolution:** ~1 km to 5 km downscaled numerical weather prediction models (ECMWF, GFS).
- **Access URL:** [https://open-meteo.com/](https://open-meteo.com/)
- **License:** Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **Attribution:** "Weather data by Open-Meteo.com under CC-BY 4.0".
- **Usage in KAVAL:** Live REST API connector (`backend/app/api/seer.py`) dynamically fetches precipitation curves and feeds them into the hydrological susceptibility model.

---

## 2. Copernicus DEM GLO-30
- **Engine:** SEER
- **Data Provided:** Digital Elevation Model (DEM), terrain slopes, drainage basins, flow accumulation proxies.
- **Resolution:** 30 meters (Global coverage).
- **Access URL:** [https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model](https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model)
- **License:** Open access under the Copernicus Sentinel Data Policy.
- **Attribution:** "Copernicus DEM provided by the European Space Agency (ESA) and Airbus".
- **Usage in KAVAL:** Forms the baseline 30-meter elevation grid across Chennai's Velachery, Adyar, and Mudichur basins for calculating micro-topographical ponding depth.

---

## 3. OpenStreetMap (OSM)
- **Engine:** DISPATCH & VULN
- **Data Provided:** Road network graph, road classifications, bridges, culverts, designated public shelters, building footprints.
- **Resolution:** Vector geometries (Nodes, Ways, Relations).
- **Access URL:** [https://www.openstreetmap.org/](https://www.openstreetmap.org/)
- **License:** Open Database License (ODbL) 1.0.
- **Attribution:** "© OpenStreetMap contributors".
- **Usage in KAVAL:** Extracted road segments are transformed into a weighted NetworkX graph where submerged segments are dynamically penalized to compute safe escape corridors.

---

## 4. India Meteorological Department (IMD) Gridded Rainfall
- **Engine:** SEER & Historical Replay
- **Data Provided:** Historical high-resolution gridded daily rainfall series (0.25° x 0.25°).
- **Access URL:** [https://mausam.imd.gov.in/](https://mausam.imd.gov.in/)
- **License:** Open Government Data (OGD) Platform India / IMD data policy.
- **Attribution:** "India Meteorological Department, Ministry of Earth Sciences, Govt. of India".
- **Usage in KAVAL:** Used to calibrate rainfall distribution benchmarks and reconstruct the December 2015 Chennai Deluge timeline.

---

## 5. Sen1Floods11 Sentinel-1 SAR Dataset
- **Engine:** SEER ML Training
- **Data Provided:** Sentinel-1 synthetic aperture radar (SAR) flood water extent segmentation ground truth masks.
- **Access URL:** [https://github.com/cloudtostreet/Sen1Floods11](https://github.com/cloudtostreet/Sen1Floods11)
- **License:** Creative Commons Attribution 4.0 (CC-BY 4.0).
- **Attribution:** "Bonavita et al., Cloud to Street / ML4Floods".
- **Usage in KAVAL:** Calibrates flood susceptibility probability boundaries for coastal alluvial soils during extreme precipitation events.

---

## 6. GloFAS (Global Flood Awareness System)
- **Engine:** SEER
- **Data Provided:** River discharge simulations, catchment-scale hydrological forecasts, return periods.
- **Access URL:** [https://www.globalfloods.eu/](https://www.globalfloods.eu/)
- **License:** Copernicus Emergency Management Service Open Data.
- **Attribution:** "European Commission Copernicus Emergency Management Service (EMS)".
- **Usage in KAVAL:** River gauge discharge threshold modeling for Adyar and Chembarambakkam outflow simulations.

---

## 7. Global Flood Database (Cloud to Street)
- **Engine:** SEER
- **Data Provided:** Historical satellite-observed flood inundation polygons.
- **Access URL:** [https://global-flood-database.cloudtostreet.ai/](https://global-flood-database.cloudtostreet.ai/)
- **License:** Open Access for academic and humanitarian resilience.
- **Attribution:** "Tellman et al., Nature 2021 / Cloud to Street".
- **Usage in KAVAL:** Validation of spatial extent for 2015 historical replay demonstration.

---

## 8. WorldPop Population Counts
- **Engine:** VULN
- **Data Provided:** High-resolution spatial population distribution estimates.
- **Access URL:** [https://www.worldpop.org/](https://www.worldpop.org/)
- **License:** Creative Commons Attribution 4.0 (CC-BY 4.0).
- **Attribution:** "WorldPop (School of Geography and Environmental Science, University of Southampton)".
- **Usage in KAVAL:** Spatial density validation for synthetic household distribution across Chennai wards.

---

## Synthetic Data Integrity Notice

To guarantee strict compliance with privacy regulations and avoid exposing real citizen personal data:
- All 120 household records generated in KAVAL are **SYNTHETIC DEMO RECORDS**.
- Names, contact numbers, and specific door numbers are randomly sampled from realistic regional distributions for demonstration purposes.
- Synthetic datasets are saved under `datasets/synthetic/` and can be inspected in JSON format.
