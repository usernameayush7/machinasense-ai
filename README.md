# MachinaSense AI ⚙️
<img width="1891" height="935" alt="Screenshot 2026-10-15 195115" src="https://github.com/user-attachments/assets/3f78ec5b-deb4-4884-be38-2d8985bc5bb0" />

### Intelligent Industrial Fault Detection and Predictive Maintenance

MachinaSense AI is an AI-powered predictive maintenance prototype designed to help identify potential industrial machine failures using operating sensor data. By analyzing machine parameters, the system predicts whether a machine may be at risk of failure and provides insights that can support maintenance decisions.

Our goal is to demonstrate how machine learning can help reduce unexpected downtime and improve industrial maintenance planning.

## 🚀 Key Features

- **Machine Failure Prediction:** Uses a machine learning model to predict potential machine failures.
- **Sensor Data Analysis:** Analyzes air temperature, process temperature, rotational speed, torque, and tool wear.
- **Failure Probability:** Provides a model-generated probability score alongside the prediction.
- **REST API:** Uses FastAPI to serve machine learning predictions.
- **Web Interface:** Provides a frontend for interacting with the system.
- **Modular Architecture:** Separates the machine learning model, backend, and frontend for easier development and integration.

## 🧠 Machine Learning Model

The prototype uses a Random Forest classifier trained on industrial machine operating data.

### Input Features

| Parameter | Description |
|---|---|
| Air Temperature | Ambient air temperature in Kelvin |
| Process Temperature | Machine process temperature in Kelvin |
| Rotational Speed | Machine rotational speed in RPM |
| Torque | Operating torque in Nm |
| Tool Wear | Accumulated tool wear in minutes |

### Model Performance

Initial evaluation on a held-out test dataset produced the following results:

- **Accuracy:** 98%
- **Failure Precision:** 0.71
- **Failure Recall:** 0.69
- **Failure F1-Score:** 0.70
- **Average Precision (PR):** 0.7686

Although overall accuracy is high, detecting actual failures is the more important challenge because failure cases are less common than normal operating cases. These results are preliminary and require further validation.

## 🏗️ Project Architecture

The project consists of three main components:

1. **Machine Learning Module:** Processes sensor readings and generates failure predictions.
2. **Backend API:** Uses FastAPI to load the trained model and expose prediction endpoints.
3. **Frontend:** Provides a user interface for entering machine parameters and viewing prediction results.

## 🛠️ Tech Stack

- **Machine Learning:** Python, scikit-learn, Pandas, NumPy, Joblib
- **ML API:** FastAPI, Uvicorn
- **Backend:** Node.js, Express.js
- **Frontend:** React, Vite
- **Version Control:** Git and GitHub

## ⚙️ Getting Started

### Prerequisites

Install the following tools before running the project:

- Python 3.10 or a compatible version
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/usernameayush7/machinasense-ai.git
cd machinasense-ai
```

### 2. Start the Machine Learning API

Open a terminal and navigate to the ML directory:

```bash
cd ml
```

Create and activate a virtual environment if one is not already configured, then install the required Python dependencies:

```bash
pip install -r requirements.txt
```

Start the API using:

```bash
uvicorn api:app --reload
```

The API should be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

Health check:

`http://127.0.0.1:8000/health`

### 3. Start the Backend

Open a new terminal:

```bash
cd backend
npm install
```

Start the backend using the start script configured in `package.json`, for example:

```bash
npm start
```

### 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

**Note:** Directory names, dependency files, and npm scripts should match the actual project repository. Configure the backend and frontend environment variables and API URLs as required.

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Check whether the API is running |
| `/health` | GET | Check API and model status |
| `/predict` | POST | Submit sensor readings for a prediction |

The `/predict` endpoint expects a JSON request containing the five sensor parameters.

Example request:

```json
{
  "Air temperature [K]": 300.0,
  "Process temperature [K]": 310.0,
  "Rotational speed [rpm]": 1500,
  "Torque [Nm]": 40.0,
  "Tool wear [min]": 120
}
```

Send this request using the POST method. The API returns a prediction based on the input readings and the trained model.

## 🌍 Our Vision

We aim to develop MachinaSense AI into a more comprehensive predictive maintenance platform by exploring real-time sensor integration, anomaly detection, explainable AI, historical trend analysis, and maintenance recommendations.

## ⚠️ Disclaimer

MachinaSense AI is a hackathon prototype intended for demonstration and experimentation. Model performance depends on the training data and evaluation conditions. Predictions have not been validated for real-world industrial safety decisions and should not be used as the sole basis for maintenance or safety-critical actions.

## 👥 Team

Developed collaboratively as a hackathon project.

## 📄 License

No license has been specified yet. Please add an appropriate open-source license if you intend to distribute the project for public reuse.

