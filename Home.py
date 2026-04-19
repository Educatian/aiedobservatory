"""
AIED Policy Dashboard — Home / Landing Page
Run with: streamlit run Home.py
"""

import streamlit as st
from pathlib import Path

st.set_page_config(
    page_title="AIED Policy Dashboard",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
.big  {font-size:2.8rem;font-weight:bold;color:#1f77b4;text-align:center}
.sub  {text-align:center;color:#555;margin-bottom:2rem}
.card {background:#f7f9fc;border-radius:12px;padding:1.2rem;border:1px solid #dde}
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="big">🎓 AIED Policy Dashboard</div>', unsafe_allow_html=True)
st.markdown('<div class="sub">AI Education Policy Adoption · US States, Counties & School Districts</div>',
            unsafe_allow_html=True)

# Data status
data_ready = Path("output_demo/data/full_report.json").exists()
if data_ready:
    st.success("✅ Demo data loaded — explore the pages from the sidebar")
else:
    st.warning("⚠️ No data yet — run `python3 demo.py` in the terminal first")

st.markdown("---")

# Feature cards
c1, c2, c3 = st.columns(3)

with c1:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 🗺️ National Map")
    st.markdown("""
- US State choropleth map
- State-by-state rankings
- Regional analysis
- 🌏 Korea / G7 benchmarking
    """)
    st.markdown("👉 **Page 1: National Map**")
    st.markdown('</div>', unsafe_allow_html=True)

with c2:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 🏫 County & District")
    st.markdown("""
- Drill down: State → County → District
- County-level choropleth map
- **Manual data entry forms**
- School district policy tracking
    """)
    st.markdown("👉 **Page 2: County & District Map**")
    st.markdown('</div>', unsafe_allow_html=True)

with c3:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 📋 Policy Indicators (10)")
    for ind in ["AI Curriculum","AI Guidelines","Teacher Training","AI Tools",
                "Ethics Policy","Pilot Programs","Data Privacy",
                "Equity Policy","AI Governance","Research Partnerships"]:
        st.markdown(f"- {ind}")
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown("### 🚀 Quick Start")

col1, col2 = st.columns(2)
with col1:
    st.code("""# 1. Generate demo data (once)
python3 demo.py

# 2. Launch dashboard
streamlit run Home.py""", language="bash")

with col2:
    st.markdown("""
**Sidebar navigation:**
1. **National Map** — state-level overview
2. **County & District Map** — drill-down + data entry

**County / District entry flow:**
1. Select a State from the sidebar
2. Search for a County
3. Check policy indicators (live score preview)
4. Save → map updates automatically
""")
