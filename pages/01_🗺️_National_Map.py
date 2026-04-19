"""
National AIED Policy Dashboard — State-level overview.
(Renamed from app_enhanced.py to fit multi-page structure)
"""

import streamlit as st, pandas as pd, plotly.express as px, plotly.graph_objects as go
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from data.international_comparison import KOREA_POLICY, G7_COUNTRIES, compare_us_to_korea
from data.us_states_data import get_state_population

st.set_page_config(page_title="National Map", page_icon="🗺️", layout="wide")

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
LEVEL_COLORS = {"NONE":"#95a5a6","EMERGING":"#e74c3c","DEVELOPING":"#f39c12",
                "ESTABLISHED":"#3498db","LEADING":"#2ecc71"}

@st.cache_data
def load_data():
    p = Path("output_demo/data/full_report.json")
    return json.loads(p.read_text()) if p.exists() else None

def region_of(name):
    for r, ss in STATE_REGIONS.items():
        if name in ss: return r
    return "Other"

def build_df(state_details):
    return pd.DataFrame([{
        "State": sd["state_name"], "Abbr": sd["state_abbr"],
        "Score": sd["adoption_score"], "Level": sd["adoption_level"],
        "Indicators": len(sd["indicators"]),
        "Region": region_of(sd["state_name"]),
        "Pop_M": get_state_population(sd["state_abbr"]),
    } for sd in state_details.values()]).sort_values("Score", ascending=False).reset_index(drop=True)

data = load_data()
if data is None:
    st.error("Run `python3 demo.py` first to generate data.")
    st.stop()

df = build_df(data["state_details"])
tabs = st.tabs(["🗺️ Map","📊 Overview","🏆 Rankings","🌎 Regional","🌏 International"])

# ── Tab 1: Choropleth Map ────────────────────────────────────────────────────
with tabs[0]:
    st.header("🗺️ US AI Education Policy Map")
    col_map, col_opt = st.columns([4, 1])
    with col_opt:
        cmap   = st.selectbox("Color scheme", ["RdYlGn","Viridis","Blues","Plasma"])
        labels = st.checkbox("State labels", False)
    with col_map:
        fig = px.choropleth(df, locations="Abbr", locationmode="USA-states",
            color="Score", scope="usa", color_continuous_scale=cmap,
            hover_name="State",
            hover_data={"Abbr":False,"Score":":.3f","Level":True,"Indicators":True},
            title="AI Education Policy Adoption Score by State")
        fig.update_layout(height=560)
        if labels:
            fig.add_scattergeo(locations=df["Abbr"], locationmode="USA-states",
                               text=df["Abbr"], mode="text", showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
    c1,c2,c3,c4 = st.columns(4)
    c1.metric("Top State", df.iloc[0]["State"], f"{df.iloc[0]['Score']:.3f}")
    c2.metric("West Avg",      f"{df[df.Region=='West']['Score'].mean():.3f}")
    c3.metric("Northeast Avg", f"{df[df.Region=='Northeast']['Score'].mean():.3f}")
    hi = (df["Score"]>0.6).sum()
    c4.metric("High Performers (>0.6)", hi)

# ── Tab 2: Overview ──────────────────────────────────────────────────────────
with tabs[1]:
    st.header("📊 National Overview")
    s, m = data["national_summary"], data["metadata"]
    c1,c2,c3,c4 = st.columns(4)
    c1.metric("Total States", m["total_states"])
    c2.metric("With Policies", m["states_with_policies"])
    c3.metric("Adoption Rate", f"{m['states_with_policies']/m['total_states']*100:.1f}%")
    c4.metric("Avg Score", f"{s['average_adoption_score']:.3f}")
    l, r = st.columns(2)
    with l:
        dist = s["adoption_distribution"]
        fig = go.Figure(go.Pie(labels=list(dist.keys()), values=list(dist.values()), hole=0.4,
            marker=dict(colors=["#95a5a6","#e74c3c","#f39c12","#3498db","#2ecc71"])))
        fig.update_layout(height=380,
            annotations=[dict(text="Levels",x=0.5,y=0.5,font_size=15,showarrow=False)])
        st.plotly_chart(fig, use_container_width=True)
    with r:
        top10 = df.head(10)[["State","Score","Level","Indicators"]].copy()
        top10.index = range(1,11)
        st.dataframe(top10, use_container_width=True,
            column_config={"Score":st.column_config.ProgressColumn(format="%.3f",min_value=0,max_value=1)})
    fig2 = px.bar(df, x="Abbr", y="Score", color="Level", color_discrete_map=LEVEL_COLORS,
                  hover_data=["State","Indicators"], title="State-by-State Adoption Score")
    fig2.update_layout(height=400)
    st.plotly_chart(fig2, use_container_width=True)

# ── Tab 3: Rankings ──────────────────────────────────────────────────────────
with tabs[2]:
    st.header("🏆 State Rankings")
    c1,c2,c3 = st.columns(3)
    rf = c1.multiselect("Region", ["All"]+list(STATE_REGIONS), ["All"])
    lf = c2.multiselect("Level",  ["All","LEADING","ESTABLISHED","DEVELOPING","EMERGING","NONE"], ["All"])
    mi = c3.slider("Min indicators", 0, 6, 0)
    fdf = df.copy()
    if "All" not in rf: fdf = fdf[fdf.Region.isin(rf)]
    if "All" not in lf: fdf = fdf[fdf.Level.isin(lf)]
    fdf = fdf[fdf.Indicators >= mi]
    st.dataframe(fdf[["State","Abbr","Region","Score","Level","Indicators","Pop_M"]].reset_index(drop=True),
        use_container_width=True, hide_index=True,
        column_config={"Score":st.column_config.ProgressColumn(format="%.3f",min_value=0,max_value=1),
                       "Pop_M":st.column_config.NumberColumn("Pop (M)",format="%.1f")})
    st.download_button("📥 Download CSV", fdf.to_csv(index=False), "aied_rankings.csv","text/csv")

# ── Tab 4: Regional ──────────────────────────────────────────────────────────
with tabs[3]:
    st.header("🌎 Regional Analysis")
    rstat = data["regional_statistics"]
    rrows = [{"Region":r,"Avg Score":v["average_score"],"Rate %":v["adoption_rate"]*100}
             for r,v in rstat.items()]
    rdf = pd.DataFrame(rrows).sort_values("Avg Score", ascending=False)
    cols = st.columns(len(rdf))
    for col, row in zip(cols, rdf.itertuples()):
        col.metric(row.Region, f"{row._2:.3f}", f"{row._3:.0f}% adoption")
    l, r = st.columns(2)
    with l:
        fig = px.bar(rdf, x="Region", y="Avg Score", color="Avg Score",
                     color_continuous_scale="RdYlGn", title="Avg Score by Region")
        st.plotly_chart(fig, use_container_width=True)
    with r:
        fig = px.bar(rdf, x="Region", y="Rate %", color="Rate %",
                     color_continuous_scale="Blues", title="Adoption Rate (%)")
        st.plotly_chart(fig, use_container_width=True)

# ── Tab 5: International ─────────────────────────────────────────────────────
with tabs[4]:
    st.header("🌏 International Comparison")
    us_avg = data["national_summary"]["average_adoption_score"]
    cmp    = compare_us_to_korea(us_avg)
    c1,c2,c3 = st.columns(3)
    c1.metric("🇺🇸 US Avg",  f"{us_avg:.3f}")
    c2.metric("🇰🇷 Korea",   f"{KOREA_POLICY.adoption_score:.3f}")
    c3.metric("Gap", f"{cmp['gap']:.3f}", f"{cmp['gap_percentage']:.1f}% behind", delta_color="inverse")
    l, r = st.columns(2)
    with l:
        st.markdown("#### 🇰🇷 Korea's Key Policies")
        for p in KOREA_POLICY.key_policies: st.markdown(f"- {p}")
    with r:
        st.markdown("#### 💡 Recommendations")
        for rec in cmp["recommendations"]: st.markdown(f"- {rec}")
    intl = [{"Country":c.country_name,"Score":c.adoption_score} for c in G7_COUNTRIES]
    intl += [{"Country":"South Korea","Score":KOREA_POLICY.adoption_score},
             {"Country":"USA (avg)",  "Score":us_avg}]
    idf = pd.DataFrame(intl).sort_values("Score", ascending=False)
    fig = px.bar(idf, x="Country", y="Score", color="Score",
                 color_continuous_scale="RdYlGn", text="Score",
                 title="G7 + Korea + USA Comparison")
    fig.update_traces(texttemplate="%{text:.2f}", textposition="outside")
    fig.update_layout(height=460)
    st.plotly_chart(fig, use_container_width=True)
    st.info(KOREA_POLICY.notes)
