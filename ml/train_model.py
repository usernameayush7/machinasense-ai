
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# 1. Load the dataset
df = pd.read_csv("data/ai4i2020.csv")

# 2. Select sensor readings
features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

X = df[features]
y = df["Machine failure"]

# 3. Split into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 4. Create the AI model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced"
)

# 5. Train the model
model.fit(X_train, y_train)

# 6. Save the trained model
joblib.dump(model, "failure_model.joblib")

print("Model training successful!")
print("Model saved as failure_model.joblib")
print("Training records:", len(X_train))
