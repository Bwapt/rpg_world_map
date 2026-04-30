#!/bin/bash

echo "🧹 Nettoyage du projet RPG World Map..."

# Nettoyer les caches Python
echo "Suppression des fichiers de cache Python..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Nettoyer les fichiers temporaires courants
echo "Suppression des fichiers temporaires..."
find . -name "*.tmp" -delete
find . -name "*.bak" -delete
find . -name "*.log" -delete
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# Nettoyer les fichiers d'éditeur
echo "Suppression des fichiers d'éditeur..."
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete

echo "✅ Nettoyage terminé !"