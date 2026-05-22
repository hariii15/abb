#!/bin/bash
# storage_stresser.sh
# Fills up the storage volume to trigger "Storage Pressure" detection
# WARNING: Only use this for controlled demo scenarios!

TARGET_DIR="/tmp"
FILE_NAME="${TARGET_DIR}/stress_file"

echo "📦 Initiating Controlled Storage Pressure Scenario..."
echo "Targeting Storage Service at ${TARGET_DIR}..."

# Create a 400MB file to fill up the likely small demo PVC
echo "Writing 400MB to ${FILE_NAME}..."
dd if=/dev/zero of=${FILE_NAME} bs=1M count=400

echo "Storage pressure applied. Run 'rm ${FILE_NAME}' to recover."
