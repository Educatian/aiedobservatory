#!/bin/bash
echo "=== AIED Policy Dashboard ==="
if ! python3 -c "import streamlit" &>/dev/null; then
    pip install -q streamlit plotly requests
fi
if [ ! -f "output_demo/data/full_report.json" ]; then
    echo "Generating demo data..."
    python3 demo.py
fi
echo "Open: http://localhost:8501"
echo "Stop: Ctrl+C"
streamlit run Home.py
