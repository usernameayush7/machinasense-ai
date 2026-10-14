
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    average_precision_score
)

# 1. Load the same dataset
df = pd.read_csv("data/ai4i2020.csv")

# 2. Select the sensor readings
features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

X = df[features]
y = df["Machine failure"]

# 3. Recreate the same train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 4. Load our trained model
model = joblib.load("failure_model.joblib")

# 5. Predict failures on unseen test data
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

# 6. Display evaluation results
print("\n=== CLASSIFICATION REPORT ===")
print(classification_report(
    y_test,
    predictions,
    target_names=["No Failure", "Failure"],
    zero_division=0
))

print("=== CONFUSION MATRIX ===")
print(confusion_matrix(y_test, predictions))

print("=== PRECISION-RECALL AVERAGE PRECISION ===")
print(round(average_precision_score(y_test, probabilities), 4))
