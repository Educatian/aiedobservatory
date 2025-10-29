#!/bin/bash

# Launch script for AI Education Policy Stats Dashboard

echo "=================================================="
echo "  AI Education Policy Stats - Dashboard Launcher"
echo "=================================================="
echo ""

# Check if streamlit is installed
if ! python3 -c "import streamlit" &> /dev/null; then
    echo "Installing required packages..."
    pip install -q streamlit plotly altair
    echo "✓ Packages installed"
    echo ""
fi

# Check if demo data exists
if [ ! -f "output_demo/data/full_report.json" ]; then
    echo "Demo data not found. Generating demo data..."
    python3 demo.py
    echo ""
fi

# Launch the app
echo "Starting Streamlit dashboard..."
echo "The app will open in your browser automatically."
echo ""
echo "To stop the server, press Ctrl+C"
echo "=================================================="
echo ""

streamlit run app.py
