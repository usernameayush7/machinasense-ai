
import sys
import json
import joblib
import pandas as pd

MODEL_PATH = "failure_model.joblib"

FEATURES = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

def predict(sensor_readings):
    model = joblib.load(MODEL_PATH)

    # Ensure the input has the expected feature names and order
    X = pd.DataFrame([sensor_readings], columns=FEATURES)

    if X.isnull().any().any():
        raise ValueError("All five sensor readings are required.")

    if not all(pd.api.types.is_numeric_dtype(X[col]) for col in X):
        raise ValueError("Sensor readings must be numeric.")

    if not all(X[col].map(lambda value: pd.notna(value) and abs(value) != float("inf")).all() for col in X):
        raise ValueError("Sensor readings must be finite numbers.")

    prediction = int(model.predict(X)[0])
    probability = float(model.predict_proba(X)[0][1])

    return {
        "predicted_failure": prediction,
        "estimated_failure_probability": round(probability, 4),
        "status": (
            "FAILURE RISK DETECTED"
            if prediction == 1
            else "NO FAILURE FLAGGED"
        ),
        "model_note": (
            "Prototype trained on synthetic data; "
            "not validated for real industrial safety decisions."
        )
    }

if __name__ == "__main__":
    try:
        sensor_readings = json.loads(sys.stdin.read())
        result = predict(sensor_readings)
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
