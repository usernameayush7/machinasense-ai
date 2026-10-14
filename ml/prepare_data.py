
import pandas as pd
from sklearn.model_selection import train_test_split

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

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Data preparation successful!")
print("Training sensor readings:", X_train.shape)
print("Testing sensor readings:", X_test.shape)
print("Training failure cases:", int(y_train.sum()))
print("Testing failure cases:", int(y_test.sum()))
