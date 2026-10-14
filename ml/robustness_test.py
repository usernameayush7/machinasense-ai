
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score

# Load dataset
df = pd.read_csv("data/ai4i2020.csv")

features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

X = df[features]
y = df["Machine failure"]

# Recreate the exact same test set
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Load the already-trained model
model = joblib.load("failure_model.joblib")

# Test on the original data
normal_predictions = model.predict(X_test)

# Simulate sensor noise on the test data only
rng = np.random.default_rng(42)
noise = rng.normal(
    loc=0,
    scale=X_train.std().to_numpy() * 0.05,
    size=X_test.shape
)

X_noisy = X_test + noise
noisy_predictions = model.predict(X_noisy)

# Compare results
for name, predictions in [
    ("Original test data", normal_predictions),
    ("Test data with simulated noise", noisy_predictions)
]:
    print(f"\n=== {name} ===")
    print("Precision:", round(
        precision_score(y_test, predictions, zero_division=0), 3
    ))
    print("Recall:", round(
        recall_score(y_test, predictions, zero_division=0), 3
    ))
    print("F1-score:", round(
        f1_score(y_test, predictions, zero_division=0), 3
    ))
