#!/usr/bin/env python3
"""
Script de test pour l'API FastAPI
"""

import requests
import json
import pandas as pd
import tempfile
import os

# URL de base de l'API
BASE_URL = "http://localhost:8000"

def test_health():
    """Test de l'endpoint de santé"""
    print("🔍 Test de l'endpoint de santé...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_root():
    """Test de l'endpoint racine"""
    print("\n🔍 Test de l'endpoint racine...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_upload():
    """Test de l'upload de fichier CSV"""
    print("\n🔍 Test de l'upload de fichier CSV...")
    
    # Créer un fichier CSV de test
    test_data = {
        'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
        'Age': [25, 30, 35, 28],
        'Score': [85, 92, 78, 88],
        'Department': ['IT', 'HR', 'IT', 'Finance']
    }
    df = pd.DataFrame(test_data)
    
    # Créer un fichier temporaire
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
    df.to_csv(temp_file.name, index=False)
    temp_file.close()
    
    try:
        # Uploader le fichier
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.csv', f, 'text/csv')}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
        
    finally:
        # Nettoyer le fichier temporaire
        os.unlink(temp_file.name)

def test_data_info():
    """Test de l'endpoint d'informations sur les données"""
    print("\n🔍 Test de l'endpoint d'informations sur les données...")
    response = requests.get(f"{BASE_URL}/data/info")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_analyze():
    """Test de l'endpoint d'analyse"""
    print("\n🔍 Test de l'endpoint d'analyse...")
    data = {'query': 'What is the average age of the employees?'}
    response = requests.post(f"{BASE_URL}/analyze", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_visualize():
    """Test de l'endpoint de visualisation"""
    print("\n🔍 Test de l'endpoint de visualisation...")
    data = {'prompt': 'Create a bar chart showing the average score by department'}
    response = requests.post(f"{BASE_URL}/visualize", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests de l'API FastAPI...")
    
    tests = [
        ("Health Check", test_health),
        ("Root Endpoint", test_root),
        ("Upload CSV", test_upload),
        ("Data Info", test_data_info),
        ("Analyze Data", test_analyze),
        ("Visualize Data", test_visualize)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
            print(f"✅ {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    print("\n📊 Résumé des tests:")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"Tests réussis: {passed}/{total}")
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")

if __name__ == "__main__":
    main()

