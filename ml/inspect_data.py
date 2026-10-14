
import pandas as pd

df = pd.read_csv("data/ai4i2020.csv")

print("Dataset shape:", df.shape)

print("\nColumn names:")
print(df.columns.tolist())

print("\nFirst five rows:")
print(df.head())

print("\nMissing values:")
print(df.isnull().sum())

if "Machine failure" in df.columns:
    print("\nFailure label counts:")
    print(df["Machine failure"].value_counts())
