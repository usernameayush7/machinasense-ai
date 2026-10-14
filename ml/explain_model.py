
import joblib
import pandas as pd

# Load the trained model
model = joblib.load("failure_model.joblib")

# These must be in the same order as the training features
features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

# Get the model's global feature importance scores
importance = model.feature_importances_

results = pd.DataFrame({
    "Sensor": features,
    "Importance": importance
})

results = results.sort_values(
    by="Importance",
    ascending=False
)

print("\n=== SENSOR FEATURE IMPORTANCE ===")
print(results.to_string(index=False))

print("\nNote: These scores describe the model overall.")
print("They do not prove that a sensor caused a failure.")
