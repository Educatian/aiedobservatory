#!/bin/bash
# Launch enhanced dashboard

echo "=== AIED Policy Dashboard — Enhanced ==="
echo ""

if ! python3 -c "import streamlit" &>/dev/null; then
    pip install -q streamlit plotly
fi

if [ ! -f "output_demo/data/full_report.json" ]; then
    echo "Generating demo data..."
    python3 demo.py
fi

echo "Starting: http://localhost:8501"
echo "Stop: Ctrl+C"
echo ""
streamlit run app_enhanced.py
