"""
Enhanced AIED Policy Dashboard
- 🗺️ US Choropleth Map
- 🌏 Korea / G7 International Comparison
- 📊 18-indicator Enhanced Rubric
- 📥 CSV Download
- 3 View Modes: Research / Policy / International
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from src.models import PolicyAdoptionLevel
from data.international_comparison import KOREA_POLICY, G7_COUNTRIES, compare_us_to_korea
from data.us_states_data import get_state_fips, get_state_population

st.set_page_config(
    page_title="AIED Policy Dashboard Enhanced",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
.big-title {font-size:2.5rem;font-weight:bold;color:#1f77b4;text-align:center;margin-bottom:0.5rem}
.sub-title {text-align:center;color:#555;margin-bottom:1.5rem}
</style>
""", unsafe_allow_html=True)

STATE_REGIONS = {
    "Northeast": ["Connecticut","Maine","Massachusetts","New Hampshire","Rhode Island",
                  "Vermont","New Jersey","New York","Pennsylvania"],
    "Midwest":   ["Illinois","Indiana","Michigan","Ohio","Wisconsin","Iowa","Kansas",
                  "Minnesota","Missouri","Nebraska","North Dakota","South Dakota"],
    "South":     ["Delaware","Florida","Georgia","Maryland","North Carolina","South Carolina",
                  "Virginia","West Virginia","Alabama","Kentucky","Mississippi","Tennessee",
                  "Arkansas","Louisiana","Oklahoma","Texas"],
    "West":      ["Arizona","Colorado","Idaho","Montana","Nevada","New Mexico","Utah",
                  "Wyoming","Alaska","California","Hawaii","Oregon","Washington"],
}

LEVEL_COLORS = {
    "NONE": "#95a5a6", "EMERGING": "#e74c3c",
    "DEVELOPING": "#f39c12", "ESTABLISHED": "#3498db", "LEADING": "#2ecc71",
}

ENHANCED_RUBRIC = {
    "Curriculum & Standards (25%)": {
        "AI_CURRICULUM": 15, "AI_LITERACY_STANDARDS": 5, "CS_AI_INTEGRATION": 5
    },
    "Guidelines & Governance (25%)": {
        "AI_GUIDELINES": 10, "AI_GOVERNANCE": 8, "DATA_PRIVACY": 7
    },
    "Professional Development (20%)": {
        "TEACHER_TRAINING": 12, "ADMIN_TRAINING": 4, "PD_PROGRAMS": 4
    },
    "Tools & Infrastructure (15%)": {
        "AI_TOOLS": 8, "EDTECH_INFRASTRUCTURE": 4, "AI_PLATFORMS": 3
    },
    "Ethics & Equity (10%)": {
        "ETHICS_POLICY": 5, "EQUITY_POLICY": 3, "BIAS_MITIGATION": 2
    },
    "Innovation (5%)": {
        "PILOT_PROGRAMS": 3, "INNOVATION_LABS": 1, "RESEARCH_PARTNERSHIPS": 1
    },
}


@st.cache_data
def load_data():
    path = Path("output_demo/data/full_report.json")
    if path.exists():
        return json.loads(path.read_text())
    return None


def region_of(name):
    for r, states in STATE_REGIONS.items():
        if name in states:
            return r
    return "Other"


def build_state_df(state_details):
    rows = []
    for sd in state_details.values():
        rows.append({
            "State": sd["state_name"],
            "Abbr":  sd["state_abbr"],
            "Score": sd["adoption_score"],
            "Level": sd["adoption_level"],
            "Indicators": len(sd["indicators"]),
            "Region": region_of(sd["state_name"]),
            "Pop_M": get_state_population(sd["state_abbr"]),
        })
    return pd.DataFrame(rows).sort_values("Score", ascending=False).reset_index(drop=True)


# ─── Sidebar ──────────────────────────────────────────────────────────────────
def sidebar():
    with st.sidebar:
        st.header("⚙️ Settings")
        mode = st.radio("View Mode", ["Research", "Policy", "International"])
        st.markdown("---")
        st.markdown("**🆕 Enhanced Features**")
        st.markdown("🗺️ US Choropleth Map\n\n🌏 Korea / G7 Benchmark\n\n📊 18-indicator Rubric\n\n📥 CSV Export\n\n🔬 Impact Analysis")
    return mode


# ─── Tabs ─────────────────────────────────────────────────────────────────────
def tab_map(df):
    st.header("🗺️ AI Education Policy Map (USA)")
    col_map, col_opt = st.columns([4, 1])

    with col_opt:
        st.markdown("### ⚙️ Map")
        cmap = st.selectbox("Colors", ["RdYlGn", "Viridis", "Blues", "Plasma"])
        labels = st.checkbox("State labels", False)

    with col_map:
        fig = px.choropleth(
            df, locations="Abbr", locationmode="USA-states",
            color="Score", scope="usa",
            color_continuous_scale=cmap,
            hover_name="State",
            hover_data={"Abbr": False, "Score": ":.3f", "Level": True, "Indicators": True},
            title="AI Education Policy Adoption Score by State",
        )
        fig.update_layout(height=580, geo=dict(scope="usa"))
        if labels:
            fig.add_scattergeo(
                locations=df["Abbr"], locationmode="USA-states",
                text=df["Abbr"], mode="text", showlegend=False,
            )
        st.plotly_chart(fig, use_container_width=True)

    # Quick stats below map
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Top State", df.iloc[0]["State"], f"{df.iloc[0]['Score']:.3f}")
    c2.metric("West Avg", f"{df[df.Region=='West']['Score'].mean():.3f}")
    c3.metric("Northeast Avg", f"{df[df.Region=='Northeast']['Score'].mean():.3f}")
    high = (df["Score"] > 0.6).sum()
    c4.metric("High Performers", high, f"{high/len(df)*100:.0f}%")


def tab_overview(data, df):
    st.header("📊 National Overview")
    s = data["national_summary"]
    m = data["metadata"]

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total States", m["total_states"])
    c2.metric("With Policies", m["states_with_policies"])
    pct = m["states_with_policies"] / m["total_states"] * 100
    c3.metric("Adoption Rate", f"{pct:.1f}%")
    c4.metric("Avg Score", f"{s['average_adoption_score']:.3f}")

    st.markdown("---")
    left, right = st.columns(2)

    with left:
        st.subheader("Adoption Level Distribution")
        dist = s["adoption_distribution"]
        fig = go.Figure(go.Pie(
            labels=list(dist.keys()), values=list(dist.values()),
            hole=0.4,
            marker=dict(colors=["#95a5a6","#e74c3c","#f39c12","#3498db","#2ecc71"]),
        ))
        fig.update_layout(height=380,
            annotations=[dict(text="Levels", x=0.5, y=0.5, font_size=15, showarrow=False)])
        st.plotly_chart(fig, use_container_width=True)

    with right:
        st.subheader("Top 10 States")
        top10 = df.head(10)[["State", "Score", "Level", "Indicators"]].copy()
        top10.index = range(1, 11)
        st.dataframe(top10, use_container_width=True,
            column_config={"Score": st.column_config.ProgressColumn(format="%.3f", min_value=0, max_value=1)})

    st.markdown("---")
    st.subheader("All States — Adoption Score")
    fig2 = px.bar(df, x="Abbr", y="Score", color="Level",
                  color_discrete_map=LEVEL_COLORS,
                  hover_data=["State", "Indicators"],
                  title="State-by-State Adoption Score")
    fig2.update_layout(height=420, xaxis_title="State", yaxis_title="Score")
    st.plotly_chart(fig2, use_container_width=True)


def tab_rankings(df):
    st.header("🏆 State Rankings")

    c1, c2, c3 = st.columns(3)
    region_f = c1.multiselect("Region", ["All"]+list(STATE_REGIONS), ["All"])
    level_f  = c2.multiselect("Level", ["All","LEADING","ESTABLISHED","DEVELOPING","EMERGING","NONE"], ["All"])
    min_ind  = c3.slider("Min Indicators", 0, 6, 0)

    fdf = df.copy()
    if "All" not in region_f: fdf = fdf[fdf.Region.isin(region_f)]
    if "All" not in level_f:  fdf = fdf[fdf.Level.isin(level_f)]
    fdf = fdf[fdf.Indicators >= min_ind]

    st.markdown(f"**{len(fdf)} states**")
    st.dataframe(fdf[["State","Abbr","Region","Score","Level","Indicators","Pop_M"]].reset_index(drop=True),
        use_container_width=True, hide_index=True,
        column_config={
            "Score": st.column_config.ProgressColumn(format="%.3f", min_value=0, max_value=1),
            "Pop_M": st.column_config.NumberColumn("Pop (M)", format="%.1f"),
        })

    st.download_button("📥 Download CSV", fdf.to_csv(index=False),
                       "aied_rankings.csv", "text/csv")

    top_n = st.slider("Show top N", 5, len(fdf), min(20, len(fdf)))
    plot = fdf.head(top_n)
    fig = go.Figure(go.Bar(
        y=plot.State, x=plot.Score, orientation="h",
        marker=dict(color=plot.Score, colorscale="RdYlGn", showscale=True),
        text=plot.Score.round(3), textposition="auto",
    ))
    fig.update_layout(title=f"Top {top_n} States", height=max(400, top_n*24),
                      yaxis={"categoryorder":"total ascending"})
    st.plotly_chart(fig, use_container_width=True)


def tab_regional(data, df):
    st.header("🌎 Regional Analysis")
    stats = data["regional_statistics"]

    rows = [{"Region": r, "Avg Score": v["average_score"],
             "States": v["total_states"], "With Policy": v["states_with_policies"],
             "Rate %": v["adoption_rate"]*100} for r, v in stats.items()]
    rdf = pd.DataFrame(rows).sort_values("Avg Score", ascending=False)

    cols = st.columns(len(rdf))
    for col, row in zip(cols, rdf.itertuples()):
        col.metric(row.Region, f"{row._2:.3f}", f"{row._5:.0f}% adoption")

    st.markdown("---")
    l, r = st.columns(2)
    with l:
        fig = px.bar(rdf, x="Region", y="Avg Score",
                     color="Avg Score", color_continuous_scale="RdYlGn",
                     title="Avg Adoption Score by Region")
        st.plotly_chart(fig, use_container_width=True)
    with r:
        fig = px.bar(rdf, x="Region", y="Rate %",
                     color="Rate %", color_continuous_scale="Blues",
                     title="Adoption Rate by Region (%)")
        st.plotly_chart(fig, use_container_width=True)

    # Sunburst
    st.subheader("State Distribution (Sunburst)")
    fig3 = px.sunburst(df, path=["Region","State"], values="Score",
                       color="Score", color_continuous_scale="RdYlGn",
                       title="States grouped by Region (sized by score)")
    fig3.update_layout(height=560)
    st.plotly_chart(fig3, use_container_width=True)


def tab_state_detail(data, df):
    st.header("🔍 State Detail")
    sel = st.selectbox("Select State", df.State.tolist())
    row = df[df.State == sel].iloc[0]
    sd  = next(v for v in data["state_details"].values() if v["state_name"] == sel)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Score", f"{row.Score:.3f}")
    c2.metric("Level", row.Level)
    c3.metric("Indicators", row.Indicators)
    c4.metric("Pop", f"{row.Pop_M:.1f}M")

    if sd["indicators"]:
        ind_types = ["AI_CURRICULUM","AI_GUIDELINES","TEACHER_TRAINING",
                     "AI_TOOLS","ETHICS_POLICY","PILOT_PROGRAMS"]
        found = {i["type"] for i in sd["indicators"]}
        vals  = [1 if t in found else 0 for t in ind_types]

        fig = go.Figure(go.Scatterpolar(r=vals, theta=ind_types, fill="toself", name=sel))
        fig.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0,1])),
                          title="Policy Radar Chart", showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

        by_type: dict = {}
        for ind in sd["indicators"]:
            by_type.setdefault(ind["type"], []).append(ind)

        st.subheader("Evidence Details")
        for itype, inds in by_type.items():
            with st.expander(f"{itype}  ({len(inds)})"):
                for ind in inds:
                    st.write(f"**Confidence:** {ind['confidence_score']:.2f}")
                    st.write(f"**Source:** [{ind['source_url']}]({ind['source_url']})")
                    if ind.get("evidence"):
                        st.caption(ind["evidence"])
    else:
        st.info("No indicators found for this state.")


def tab_analytics(df):
    st.header("📈 Enhanced Analytics")

    st.subheader("📋 Enhanced 18-Indicator Rubric")
    rubric_rows = []
    for dim, inds in ENHANCED_RUBRIC.items():
        for name, w in inds.items():
            rubric_rows.append({"Dimension": dim, "Indicator": name, "Weight (%)": w})
    st.dataframe(pd.DataFrame(rubric_rows), use_container_width=True, hide_index=True)

    st.markdown("---")
    st.subheader("📊 Score Distribution")
    fig = px.histogram(df, x="Score", nbins=20, color="Level",
                       color_discrete_map=LEVEL_COLORS,
                       title="Distribution of Adoption Scores")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("🔬 Planned: Impact Analysis")
        st.markdown("""
- STEM achievement correlation
- CS enrollment vs policy score
- Teacher AI adoption rates
- Title I equity gap analysis
- EdTech usage statistics
- AI workforce pipeline (CTE)
        """)
    with c2:
        st.subheader("📡 Planned: Data Sources")
        st.markdown("""
- DoE Official Documents (FOIA)
- GovTrack / RSS monitoring
- Education Data Portal API
- EdWeek Policy Briefings
- Brookings Institution
- UNESCO AI Framework
        """)


def tab_international(data, df):
    st.header("🌏 International Comparison")
    us_avg = data["national_summary"]["average_adoption_score"]
    cmp = compare_us_to_korea(us_avg)

    # US vs Korea
    st.subheader("🇺🇸 US Average vs 🇰🇷 South Korea")
    c1, c2, c3 = st.columns(3)
    c1.metric("🇺🇸 US Avg", f"{us_avg:.3f}")
    c2.metric("🇰🇷 Korea",  f"{KOREA_POLICY.adoption_score:.3f}")
    c3.metric("Gap", f"{cmp['gap']:.3f}", f"{cmp['gap_percentage']:.1f}% behind", delta_color="inverse")

    l, r = st.columns(2)
    with l:
        st.markdown("#### Korea's Key Policies")
        for p in KOREA_POLICY.key_policies:
            st.markdown(f"- {p}")
    with r:
        st.markdown("#### Recommendations for US")
        for rec in cmp["recommendations"]:
            st.markdown(f"- {rec}")

    st.markdown("---")

    # G7 chart
    st.subheader("🌐 G7 + Korea + USA Comparison")
    intl_rows = [{"Country": c.country_name, "Score": c.adoption_score}
                 for c in G7_COUNTRIES]
    intl_rows.append({"Country": "South Korea", "Score": KOREA_POLICY.adoption_score})
    intl_rows.append({"Country": "USA (avg)", "Score": us_avg})
    intl_df = pd.DataFrame(intl_rows).sort_values("Score", ascending=False)

    fig = px.bar(intl_df, x="Country", y="Score", color="Score",
                 color_continuous_scale="RdYlGn", text="Score",
                 title="AI Ed Policy Adoption: International Benchmark")
    fig.update_traces(texttemplate="%{text:.2f}", textposition="outside")
    fig.update_layout(height=480)
    st.plotly_chart(fig, use_container_width=True)
    st.dataframe(intl_df, use_container_width=True, hide_index=True)

    st.info(KOREA_POLICY.notes)


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    st.markdown('<div class="big-title">🎓 AIED Policy Dashboard — Enhanced</div>',
                unsafe_allow_html=True)
    st.markdown('<div class="sub-title">AI Education Policy Adoption · US States + International Benchmark</div>',
                unsafe_allow_html=True)

    mode = sidebar()
    data = load_data()

    if data is None:
        st.error("⚠️ No data found. Run `python3 demo.py` first.")
        return

    df = build_state_df(data["state_details"])

    if mode == "International":
        tab_international(data, df)
        return

    # Research / Policy modes share the same tabs
    tabs = st.tabs(["🗺️ Map", "📊 Overview", "🏆 Rankings",
                    "🌎 Regional", "🔍 State Detail", "📈 Analytics", "🌏 International"])

    with tabs[0]: tab_map(df)
    with tabs[1]: tab_overview(data, df)
    with tabs[2]: tab_rankings(df)
    with tabs[3]: tab_regional(data, df)
    with tabs[4]: tab_state_detail(data, df)
    with tabs[5]: tab_analytics(df)
    with tabs[6]: tab_international(data, df)


if __name__ == "__main__":
    main()
