"""
NLTK Data Setup Script
Run this once after installing requirements to download necessary NLTK data
"""

import nltk
import sys

print("Downloading NLTK data packages...")
print("-" * 50)

packages = [
    'punkt',
    'stopwords',
    'wordnet',
    'averaged_perceptron_tagger',
    'maxent_ne_chunker',
    'words'
]

for package in packages:
    try:
        print(f"Downloading {package}...", end=" ")
        nltk.download(package, quiet=True)
        print("✓ Done")
    except Exception as e:
        print(f"✗ Failed: {e}")
        sys.exit(1)

print("-" * 50)
print("All NLTK data downloaded successfully!")
print("You can now run the application with: python app.py")