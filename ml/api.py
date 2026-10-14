
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

# Find the saved model relative to this file
MODEL_PATH = Path(__file__).resolve().parent / "failure_model.joblib"
model = joblib.load(MODEL_PATH)

app = FastAPI(
    title="MachinaSense AI",
    description="Machine failure prediction prototype",
    version="1.0.0"
)


# Define the five sensor readings expected by the model
class SensorReadings(BaseModel):
    air_temperature: float = Field(
        alias="Air temperature [K]"
    )
    process_temperature: float = Field(
        alias="Process temperature [K]"
    )
    rotational_speed: float = Field(
        alias="Rotational speed [rpm]"
    )
    torque: float = Field(alias="Torque [Nm]")
    tool_wear: float = Field(alias="Tool wear [min]")


@app.get("/")
def home():
    return {
        "message": "MachinaSense AI API is running",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
def predict(readings: SensorReadings):
    # Convert request into the exact feature order used in training
    sensor_data = pd.DataFrame([{
        "Air temperature [K]": readings.air_temperature,
        "Process temperature [K]": readings.process_temperature,
        "Rotational speed [rpm]": readings.rotational_speed,
        "Torque [Nm]": readings.torque,
        "Tool wear [min]": readings.tool_wear
    }])

    prediction = int(model.predict(sensor_data)[0])
    probability = float(model.predict_proba(sensor_data)[0][1])

    return {
        "predicted_failure": prediction,
        "estimated_failure_probability": round(probability, 4),
        "status": (
            "FAILURE RISK DETECTED"
            if prediction == 1
            else "NO FAILURE FLAGGED"
        ),
        "model_note": (
            "Prototype trained on synthetic data. "
            "Not validated for real industrial safety decisions."
        )
    }
