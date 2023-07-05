import pandas as pd

file = "./results/expectedOutput.csv"
df = pd.read_csv(file)
pd.options.display.max_columns = len(df.columns)
print(df)