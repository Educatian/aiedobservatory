"""
County & School District Drill-Down Map with Data Entry

Flow:  Select State → View County Map → Select County
       → View Districts → Enter/Edit Policy Data
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests, json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.district_db import (
    POLICY_INDICATORS, INDICATOR_WEIGHTS,
    get_all_counties, upsert_county, compute_district_score, score_to_level,
    get_all_districts, upsert_district, delete_district,
    export_to_records,
)
from data.county_fips import get_counties_for_state, search_county
from data.us_states_data import STATE_POPULATIONS

# ── Config ───────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="County & District Map",
    page_icon="🏫",
    layout="wide",
    initial_sidebar_state="expanded",
)

ALL_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
    "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

STATE_NAMES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
    "CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia",
    "HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa",
    "KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland",
    "MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri",
    "MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey",
    "NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio",
    "OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina",
    "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
    "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming",
}

LEVEL_COLOR = {
    "LEADING":"#2ecc71","ESTABLISHED":"#3498db",
    "DEVELOPING":"#f39c12","EMERGING":"#e74c3c","NONE":"#bdc3c7",
}

INDICATOR_LABELS = {
    "AI_CURRICULUM":        "📚 AI Curriculum",
    "AI_GUIDELINES":        "📋 AI Guidelines",
    "TEACHER_TRAINING":     "👩‍🏫 Teacher Training",
    "AI_TOOLS":             "🛠️ AI Tools",
    "ETHICS_POLICY":        "⚖️ Ethics Policy",
    "PILOT_PROGRAMS":       "🚀 Pilot Programs",
    "DATA_PRIVACY":         "🔒 Data Privacy",
    "EQUITY_POLICY":        "🌈 Equity Policy",
    "AI_GOVERNANCE":        "🏛️ AI Governance",
    "RESEARCH_PARTNERSHIPS":"🔬 Research Partnerships",
}


# ── GeoJSON loader ────────────────────────────────────────────────────────────
@st.cache_data(ttl=3600)
def load_county_geojson():
    """Load US county GeoJSON from Plotly's public dataset."""
    url = "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json"
    try:
        r = requests.get(url, timeout=15)
        return r.json()
    except Exception:
        return None


# ── Helpers ───────────────────────────────────────────────────────────────────
def indicator_form(prefix: str, defaults: dict | None = None) -> dict:
    """Render checkboxes for all indicators. Returns {indicator: bool}."""
    defaults = defaults or {}
    result = {}
    cols = st.columns(2)
    for i, ind in enumerate(POLICY_INDICATORS):
        with cols[i % 2]:
            result[ind] = st.checkbox(
                INDICATOR_LABELS.get(ind, ind),
                value=defaults.get(ind, False),
                key=f"{prefix}_{ind}",
            )
    return result


def live_score_display(indicators: dict):
    """Show live score preview as user checks boxes."""
    score = compute_district_score(indicators)
    level = score_to_level(score)
    color = LEVEL_COLOR[level]
    st.markdown(
        f"**Live Score:** "
        f"<span style='font-size:1.4rem;font-weight:bold;color:{color}'>"
        f"{score:.3f}</span> — "
        f"<span style='color:{color}'>{level}</span>",
        unsafe_allow_html=True,
    )
    # Mini bar
    st.progress(score)


# ── County Choropleth ─────────────────────────────────────────────────────────
def show_county_map(state_abbr: str, geojson, db_counties: dict):
    """Render county-level choropleth for the selected state."""
    counties = get_counties_for_state(state_abbr)
    if not counties:
        st.info(f"County FIPS data not yet loaded for **{state_abbr}**. "
                "You can still add data via the form below.")
        return

    rows = []
    for fips, name in counties.items():
        entry = db_counties.get(fips, {})
        rows.append({
            "fips":  fips,
            "county": name,
            "score": entry.get("county_score", None),
            "level": entry.get("county_level", "NO DATA"),
            "districts": len(entry.get("districts", {})),
            "has_data": fips in db_counties,
        })

    df = pd.DataFrame(rows)
    has_any = df["has_data"].any()

    if geojson and has_any:
        # Filter GeoJSON to state only
        state_fips_prefix = fips[:2] if counties else ""  # first 2 digits
        state_features = [
            f for f in geojson["features"]
            if f["id"].startswith(state_fips_prefix)
        ]
        state_geo = {"type": "FeatureCollection", "features": state_features}

        plot_df = df[df["has_data"]].copy()
        fig = px.choropleth(
            plot_df, geojson=state_geo,
            locations="fips", featureidkey="id",
            color="score",
            color_continuous_scale="RdYlGn",
            range_color=[0, 1],
            hover_name="county",
            hover_data={"fips": False, "score": ":.3f", "level": True, "districts": True},
            title=f"AI Ed Policy Scores — {STATE_NAMES.get(state_abbr, state_abbr)} Counties",
        )
        fig.update_geos(fitbounds="locations", visible=False)
        fig.update_layout(height=500, margin={"r":0,"t":40,"l":0,"b":0})
        st.plotly_chart(fig, use_container_width=True)
    else:
        # Placeholder bar chart until data is entered
        st.info("Enter county data below to see the choropleth map. "
                "Scores appear automatically after saving.")
        if has_any:
            bar_df = df[df["has_data"]].sort_values("score", ascending=False)
            fig = px.bar(bar_df, x="county", y="score",
                         color="level", color_discrete_map=LEVEL_COLOR,
                         title="Counties with Data Entered")
            fig.update_layout(height=350)
            st.plotly_chart(fig, use_container_width=True)

    return df


# ── County Entry Form ─────────────────────────────────────────────────────────
def county_entry_panel(state_abbr: str, counties: dict, db_counties: dict):
    st.markdown("---")
    st.subheader("📝 Add / Edit County Policy Data")

    # County selector
    search = st.text_input("🔍 Search county name", placeholder="e.g. Los Angeles")
    if search:
        filtered = search_county(state_abbr, search)
    else:
        filtered = counties

    if not filtered:
        st.warning("No counties found. Check the search term or select a different state.")
        return

    county_options = {f"{name} ({fips})": fips for fips, name in sorted(filtered.items(), key=lambda x: x[1])}
    chosen_label = st.selectbox("Select County", list(county_options.keys()))
    county_fips  = county_options[chosen_label]
    county_name  = chosen_label.split(" (")[0]

    # Pre-fill from existing data
    existing = db_counties.get(county_fips, {})
    existing_indicators = existing.get("indicators", {})

    with st.form(key=f"county_form_{county_fips}"):
        st.markdown(f"#### {county_name} — Policy Indicators")
        st.caption("Check each indicator that has been formally adopted by the county/district offices.")

        indicators = indicator_form(f"county_{county_fips}", existing_indicators)
        live_score_display(indicators)

        col1, col2 = st.columns(2)
        with col1:
            notes = st.text_area("Notes / Sources", value=existing.get("notes",""),
                                 placeholder="e.g. Board resolution #2024-15, adopted March 2024")
        with col2:
            entered_by = st.text_input("Entered by", value=existing.get("entered_by",""),
                                       placeholder="Your name or org")

        submitted = st.form_submit_button("💾 Save County Data", type="primary")

    if submitted:
        score = upsert_county(state_abbr, county_fips, county_name,
                              indicators, notes, entered_by)
        level = score_to_level(score)
        st.success(f"✅ Saved **{county_name}** — Score: {score:.3f} ({level})")
        st.rerun()


# ── District Panel ────────────────────────────────────────────────────────────
def district_panel(state_abbr: str, counties: dict, db_counties: dict):
    st.markdown("---")
    st.subheader("🏫 School District Data Entry")

    # Pick county first
    county_options_all = {f"{name} ({fips})": fips for fips, name in sorted(counties.items(), key=lambda x: x[1])}
    if not county_options_all:
        st.info("No county data available for this state yet.")
        return

    chosen_label = st.selectbox("Select County for District Entry", list(county_options_all.keys()),
                                key="district_county_select")
    county_fips = county_options_all[chosen_label]
    county_name = chosen_label.split(" (")[0]

    existing_districts = get_all_districts(state_abbr, county_fips)

    # Show existing districts
    if existing_districts:
        st.markdown(f"**Existing districts in {county_name}:**")
        dist_rows = [
            {"District": d["district_name"], "Score": d.get("district_score",0),
             "Level": d.get("district_level","NONE"), "NCES ID": d.get("nces_id",""),
             "Updated": d.get("last_updated",""), "Key": k}
            for k, d in existing_districts.items()
        ]
        dist_df = pd.DataFrame(dist_rows)

        # Radar overlay for top districts
        if len(dist_rows) > 0:
            fig = go.Figure()
            ind_types = list(INDICATOR_LABELS.keys())
            for drow in dist_rows[:5]:
                dk = drow["Key"]
                dd = existing_districts[dk]
                vals = [1 if dd.get("indicators",{}).get(ind,False) else 0
                        for ind in ind_types]
                fig.add_trace(go.Scatterpolar(
                    r=vals, theta=[INDICATOR_LABELS[i] for i in ind_types],
                    fill="toself", name=dd["district_name"],
                ))
            fig.update_layout(
                polar=dict(radialaxis=dict(visible=True, range=[0,1])),
                title="District Policy Radar (top 5)",
                height=420,
            )
            st.plotly_chart(fig, use_container_width=True)

        display_df = dist_df[["District","Score","Level","NCES ID","Updated"]]
        st.dataframe(display_df, use_container_width=True, hide_index=True,
            column_config={"Score": st.column_config.ProgressColumn(
                format="%.3f", min_value=0, max_value=1)})

        # Delete option
        del_key = st.selectbox("Delete a district", ["— none —"] + [r["Key"] for r in dist_rows])
        if del_key != "— none —" and st.button("🗑️ Delete", type="secondary"):
            delete_district(state_abbr, county_fips, del_key)
            st.success(f"Deleted {del_key}")
            st.rerun()

    # Add / Edit form
    st.markdown("#### ➕ Add / Update District")
    with st.form(key=f"district_form_{county_fips}"):
        col1, col2 = st.columns(2)
        with col1:
            dist_name = st.text_input("District Name *",
                                      placeholder="e.g. Los Angeles Unified School District")
            nces_id   = st.text_input("NCES District ID",
                                      placeholder="e.g. 0622710")
        with col2:
            dist_key  = st.text_input("Short Key *",
                                      placeholder="e.g. LAUSD  (used as ID, no spaces)")
            entered_by = st.text_input("Entered by", placeholder="Your name")

        st.markdown("**Policy Indicators**")
        # Pre-fill if editing existing
        prefill_key = dist_key if dist_key in existing_districts else None
        prefill = existing_districts.get(prefill_key, {}).get("indicators", {}) if prefill_key else {}
        indicators = indicator_form(f"dist_{county_fips}", prefill)
        live_score_display(indicators)

        notes = st.text_area("Notes / Sources",
                             placeholder="Board meeting minutes, policy document URLs…")
        submitted = st.form_submit_button("💾 Save District", type="primary")

    if submitted:
        if not dist_name or not dist_key:
            st.error("District Name and Short Key are required.")
        else:
            clean_key = dist_key.strip().upper().replace(" ","_")
            score = upsert_district(
                state_abbr, county_fips, county_name,
                clean_key, dist_name, nces_id,
                indicators, notes, entered_by,
            )
            st.success(f"✅ Saved **{dist_name}** — Score: {score:.3f} ({score_to_level(score)})")
            st.rerun()


# ── Overview table ────────────────────────────────────────────────────────────
def overview_panel():
    st.subheader("📊 All Entered Data")
    records = export_to_records()
    if not records:
        st.info("No data entered yet. Select a state and start adding counties / districts above.")
        return

    df = pd.DataFrame(records)
    st.dataframe(df, use_container_width=True, hide_index=True,
        column_config={"score": st.column_config.ProgressColumn(
            format="%.3f", min_value=0, max_value=1)})

    csv = df.to_csv(index=False)
    st.download_button("📥 Export All as CSV", csv,
                       "county_district_aied_data.csv", "text/csv")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    st.title("🏫 County & District AIED Policy Map")
    st.markdown(
        "Drill down from **State → County → School District** to enter and visualize "
        "AI Education Policy adoption at each level."
    )

    # ── Sidebar: state picker ─────────────────────────────────────────────
    with st.sidebar:
        st.header("📍 Navigation")
        state_abbr = st.selectbox(
            "Select State",
            ALL_STATES,
            format_func=lambda a: f"{a} — {STATE_NAMES.get(a, a)}",
        )
        st.markdown("---")
        panel = st.radio(
            "Panel",
            ["🗺️ County Map & Data", "🏫 District Data", "📊 Overview / Export"],
        )
        st.markdown("---")
        st.markdown(f"**{STATE_NAMES.get(state_abbr)}**")
        db_counties = get_all_counties(state_abbr)
        counties    = get_counties_for_state(state_abbr)
        st.metric("Counties with data", len(db_counties))
        total_districts = sum(len(c.get("districts",{})) for c in db_counties.values())
        st.metric("Districts entered", total_districts)

        if db_counties:
            avg = sum(c["county_score"] for c in db_counties.values()) / len(db_counties)
            st.metric("County avg score", f"{avg:.3f}")

    # ── Load GeoJSON ──────────────────────────────────────────────────────
    geojson = None
    if panel == "🗺️ County Map & Data":
        with st.spinner("Loading county map data…"):
            geojson = load_county_geojson()
        if geojson is None:
            st.warning("⚠️ Could not load county GeoJSON (network issue). "
                       "Map will show after data is entered.")

    # ── Route to panel ────────────────────────────────────────────────────
    if panel == "🗺️ County Map & Data":
        st.header(f"🗺️ {STATE_NAMES.get(state_abbr)} — County Map")

        col_info, col_legend = st.columns([3, 1])
        with col_legend:
            st.markdown("**Score Legend**")
            for level, color in LEVEL_COLOR.items():
                st.markdown(
                    f"<span style='background:{color};padding:2px 8px;"
                    f"border-radius:4px;color:white'>{level}</span>",
                    unsafe_allow_html=True,
                )

        show_county_map(state_abbr, geojson, db_counties)
        county_entry_panel(state_abbr, counties, db_counties)

    elif panel == "🏫 District Data":
        st.header(f"🏫 {STATE_NAMES.get(state_abbr)} — School District Data")
        district_panel(state_abbr, counties, db_counties)

    else:
        overview_panel()


if __name__ == "__main__":
    main()
