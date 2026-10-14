
import pandas as pd
import joblib
import json

from datetime import datetime, timezone
from sklearn.model_selection import train_test_split

# 1. Load the dataset and trained model
df = pd.read_csv("data/ai4i2020.csv")
model = joblib.load("failure_model.joblib")

# 2. Select the sensor readings used during training
features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

X = df[features]
y = df["Machine failure"]

# 3. Select one unseen test example for a demo
_, X_test, _, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

sensor_readings = X_test.iloc[[0]]

# 4. Predict whether the machine will fail
prediction = int(model.predict(sensor_readings)[0])
probability = float(model.predict_proba(sensor_readings)[0][1])

# 5. Generate a simple prototype alert
if prediction == 1:
    status = "FAILURE RISK DETECTED"
    severity = "HIGH"
else:
    status = "NO FAILURE FLAGGED"
    severity = "NORMAL"

alert = {
    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "status": status,
    "severity": severity,
    "predicted_failure": prediction,
    "estimated_failure_probability": round(probability, 4),
    "sensor_readings": {
        key: float(value)
        for key, value in sensor_readings.iloc[0].items()
    },
    "demo_note": (
        "Generated from a held-out synthetic dataset record; "
        "not a live industrial sensor alert."
    )
}

# 6. Print the alert in JSON format
print(json.dumps(alert, indent=4))

# 7. Show the known label for this demo example
print("\nActual dataset label:", int(y_test.iloc[0]))
