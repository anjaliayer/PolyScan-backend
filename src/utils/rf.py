import sys
import json
import pickle

# Load the model
with open('rforest_model.pkl', 'rb') as file:
    Rforest = pickle.load(file)

# Parse the input data
input_data = json.loads(sys.argv[1])

# Convert input data to the format required by the model
# Assuming input_data is a list of lists
X_new = input_data['data']

# Make predictions
predictions = Rforest.predict(X_new)

# Print the predictions in JSON format
print(json.dumps(predictions.tolist()))
