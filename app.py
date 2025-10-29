"""
Interactive Visualization Dashboard for AI Education Policy Stats

This Streamlit app provides an interactive interface to explore
AI education policy adoption across US states.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.models import PolicyAdoptionLevel
from src.analyzer import PolicyAnalyzer
from src.reporter import PolicyReporter

# Page configuration
st.set_page_config(
    page_title="AI Education Policy Stats",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# State to US region mapping
STATE_REGIONS = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire",
                 "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin",
               "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska",
               "North Dakota", "South Dakota"],
    "South": ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina",
             "South Carolina", "Virginia", "West Virginia", "Alabama",
             "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana",
             "Oklahoma", "Texas"],
    "West": ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico",
            "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"]
}

# Initialize session state
if 'data_loaded' not in st.session_state:
    st.session_state.data_loaded = False
    st.session_state.state_policies = None
    st.session_state.summary = None
    st.session_state.regional_stats = None

@st.cache_data
def load_demo_data():
    """Load demo data from the generated demo output"""
    output_path = Path("output_demo/data/full_report.json")

    if output_path.exists():
        with open(output_path, 'r') as f:
            data = json.load(f)
        return data
    return None

def get_region_for_state(state_name):
    """Get region for a given state"""
    for region, states in STATE_REGIONS.items():
        if state_name in states:
            return region
    return "Unknown"

def main():
    # Header
    st.markdown('<div class="main-header">🎓 AI Education Policy Dashboard</div>',
                unsafe_allow_html=True)
    st.markdown("### Analyzing AI Education Policy Adoption Across US States")

    # Sidebar
    with st.sidebar:
        st.header("⚙️ Settings")

        data_source = st.radio(
            "Data Source",
            ["Demo Data", "Run New Analysis"],
            help="Use demo data or run a new analysis"
        )

        if data_source == "Run New Analysis":
            st.info("🔍 Configure and run a new analysis")

            analysis_mode = st.selectbox(
                "Analysis Mode",
                ["Quick Test (5 states)", "Custom States", "All States"]
            )

            if analysis_mode == "Custom States":
                selected_states = st.multiselect(
                    "Select States",
                    ["California", "Texas", "New York", "Florida", "Massachusetts",
                     "Illinois", "Pennsylvania", "Ohio", "Georgia", "Michigan"],
                    default=["California", "Texas"]
                )

            max_depth = st.slider("Crawl Depth", 1, 3, 2)
            delay = st.slider("Delay (seconds)", 0.5, 3.0, 1.0, 0.5)

            if st.button("🚀 Run Analysis", type="primary"):
                run_new_analysis(analysis_mode, max_depth, delay)

        st.markdown("---")
        st.markdown("### About")
        st.markdown("""
        This dashboard visualizes AI education policy adoption across US states.

        **Policy Indicators:**
        - AI Curriculum
        - AI Guidelines
        - Teacher Training
        - AI Tools
        - Ethics Policy
        - Pilot Programs
        """)

    # Load data
    demo_data = load_demo_data()

    if demo_data is None:
        st.warning("⚠️ No data available. Please run the demo first: `python3 demo.py`")
        return

    # Create tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Overview",
        "🗺️ State Rankings",
        "🌎 Regional Analysis",
        "🔍 State Details",
        "📈 Indicators Analysis"
    ])

    # Tab 1: Overview
    with tab1:
        show_overview(demo_data)

    # Tab 2: State Rankings
    with tab2:
        show_state_rankings(demo_data)

    # Tab 3: Regional Analysis
    with tab3:
        show_regional_analysis(demo_data)

    # Tab 4: State Details
    with tab4:
        show_state_details(demo_data)

    # Tab 5: Indicators Analysis
    with tab5:
        show_indicators_analysis(demo_data)

def show_overview(data):
    """Display overview tab"""
    st.header("National Overview")

    # Key metrics
    col1, col2, col3, col4 = st.columns(4)

    summary = data['national_summary']
    metadata = data['metadata']

    with col1:
        st.metric(
            "Total States",
            metadata['total_states'],
            help="Total number of states analyzed"
        )

    with col2:
        st.metric(
            "States with Policies",
            metadata['states_with_policies'],
            help="States with identifiable AI education policies"
        )

    with col3:
        adoption_rate = (metadata['states_with_policies'] / metadata['total_states']) * 100
        st.metric(
            "Adoption Rate",
            f"{adoption_rate:.1f}%",
            help="Percentage of states with AI education policies"
        )

    with col4:
        st.metric(
            "Average Score",
            f"{summary['average_adoption_score']:.3f}",
            help="Average adoption score across all states"
        )

    st.markdown("---")

    # Two column layout
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Adoption Level Distribution")

        # Create pie chart
        dist = summary['adoption_distribution']
        labels = list(dist.keys())
        values = list(dist.values())

        fig = go.Figure(data=[go.Pie(
            labels=labels,
            values=values,
            hole=0.4,
            marker=dict(colors=['#95a5a6', '#e74c3c', '#f39c12', '#3498db', '#2ecc71'])
        )])

        fig.update_layout(
            showlegend=True,
            height=400,
            annotations=[dict(text='Adoption<br>Levels', x=0.5, y=0.5, font_size=16, showarrow=False)]
        )

        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Top 10 Leading States")

        # Get top states with scores
        state_details = data['state_details']
        sorted_states = sorted(
            state_details.items(),
            key=lambda x: x[1]['adoption_score'],
            reverse=True
        )[:10]

        top_states_df = pd.DataFrame([
            {
                'Rank': i+1,
                'State': state_data['state_name'],
                'Score': f"{state_data['adoption_score']:.3f}",
                'Level': state_data['adoption_level']
            }
            for i, (state, state_data) in enumerate(sorted_states)
        ])

        st.dataframe(top_states_df, use_container_width=True, hide_index=True)

    st.markdown("---")

    # Trend visualization
    st.subheader("Policy Adoption Landscape")

    # Create bar chart of all states
    states_data = []
    for state, state_data in state_details.items():
        states_data.append({
            'State': state_data['state_abbr'],
            'Full Name': state_data['state_name'],
            'Score': state_data['adoption_score'],
            'Level': state_data['adoption_level'],
            'Indicators': len(state_data['indicators'])
        })

    df = pd.DataFrame(states_data).sort_values('Score', ascending=False)

    fig = px.bar(
        df,
        x='State',
        y='Score',
        color='Level',
        hover_data=['Full Name', 'Indicators'],
        color_discrete_map={
            'NONE': '#95a5a6',
            'EMERGING': '#e74c3c',
            'DEVELOPING': '#f39c12',
            'ESTABLISHED': '#3498db',
            'LEADING': '#2ecc71'
        },
        title="AI Education Policy Adoption by State"
    )

    fig.update_layout(height=500, xaxis_title="State", yaxis_title="Adoption Score")
    st.plotly_chart(fig, use_container_width=True)

def show_state_rankings(data):
    """Display state rankings tab"""
    st.header("State Rankings")

    state_details = data['state_details']

    # Prepare data
    states_data = []
    for state, state_data in state_details.items():
        region = get_region_for_state(state_data['state_name'])
        states_data.append({
            'State': state_data['state_name'],
            'Abbr': state_data['state_abbr'],
            'Score': state_data['adoption_score'],
            'Level': state_data['adoption_level'],
            'Indicators': len(state_data['indicators']),
            'Region': region
        })

    df = pd.DataFrame(states_data).sort_values('Score', ascending=False)
    df['Rank'] = range(1, len(df) + 1)

    # Filters
    col1, col2, col3 = st.columns(3)

    with col1:
        region_filter = st.multiselect(
            "Filter by Region",
            options=["All"] + list(STATE_REGIONS.keys()),
            default=["All"]
        )

    with col2:
        level_filter = st.multiselect(
            "Filter by Adoption Level",
            options=["All", "LEADING", "ESTABLISHED", "DEVELOPING", "EMERGING", "NONE"],
            default=["All"]
        )

    with col3:
        min_indicators = st.slider("Minimum Indicators", 0, 6, 0)

    # Apply filters
    filtered_df = df.copy()
    if "All" not in region_filter:
        filtered_df = filtered_df[filtered_df['Region'].isin(region_filter)]
    if "All" not in level_filter:
        filtered_df = filtered_df[filtered_df['Level'].isin(level_filter)]
    filtered_df = filtered_df[filtered_df['Indicators'] >= min_indicators]

    # Display table
    st.subheader(f"Showing {len(filtered_df)} states")

    display_df = filtered_df[['Rank', 'State', 'Abbr', 'Region', 'Score', 'Level', 'Indicators']]
    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            'Score': st.column_config.ProgressColumn(
                'Score',
                format="%.3f",
                min_value=0,
                max_value=1
            )
        }
    )

    # Horizontal bar chart
    st.subheader("Visual Rankings")

    fig = go.Figure()

    top_n = st.slider("Show top N states", 5, len(filtered_df), min(20, len(filtered_df)))
    plot_df = filtered_df.head(top_n)

    fig.add_trace(go.Bar(
        y=plot_df['State'],
        x=plot_df['Score'],
        orientation='h',
        marker=dict(
            color=plot_df['Score'],
            colorscale='RdYlGn',
            showscale=True
        ),
        text=plot_df['Score'].round(3),
        textposition='auto'
    ))

    fig.update_layout(
        title=f"Top {top_n} States by Adoption Score",
        xaxis_title="Adoption Score",
        yaxis_title="State",
        height=max(400, top_n * 25),
        yaxis={'categoryorder': 'total ascending'}
    )

    st.plotly_chart(fig, use_container_width=True)

def show_regional_analysis(data):
    """Display regional analysis tab"""
    st.header("Regional Analysis")

    regional_stats = data['regional_statistics']
    state_details = data['state_details']

    # Regional comparison metrics
    st.subheader("Regional Comparison")

    regions_data = []
    for region, stats in regional_stats.items():
        regions_data.append({
            'Region': region,
            'Avg Score': stats['average_score'],
            'Total States': stats['total_states'],
            'With Policies': stats['states_with_policies'],
            'Adoption Rate': stats['adoption_rate'] * 100
        })

    regions_df = pd.DataFrame(regions_data).sort_values('Avg Score', ascending=False)

    # Display metrics in columns
    cols = st.columns(len(regions_df))
    for col, (_, row) in zip(cols, regions_df.iterrows()):
        with col:
            st.metric(
                row['Region'],
                f"{row['Avg Score']:.3f}",
                f"{row['Adoption Rate']:.0f}% adoption"
            )

    st.markdown("---")

    # Regional charts
    col1, col2 = st.columns(2)

    with col1:
        fig = px.bar(
            regions_df,
            x='Region',
            y='Avg Score',
            title="Average Adoption Score by Region",
            color='Avg Score',
            color_continuous_scale='RdYlGn'
        )
        fig.update_layout(showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = px.bar(
            regions_df,
            x='Region',
            y='Adoption Rate',
            title="Adoption Rate by Region (%)",
            color='Adoption Rate',
            color_continuous_scale='Blues'
        )
        fig.update_layout(showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    # State distribution within regions
    st.subheader("State Distribution by Region")

    # Prepare data for sunburst chart
    sunburst_data = []
    for state, state_data in state_details.items():
        region = get_region_for_state(state_data['state_name'])
        sunburst_data.append({
            'State': state_data['state_name'],
            'Region': region,
            'Score': state_data['adoption_score'],
            'Level': state_data['adoption_level']
        })

    sunburst_df = pd.DataFrame(sunburst_data)

    fig = px.sunburst(
        sunburst_df,
        path=['Region', 'State'],
        values='Score',
        color='Score',
        color_continuous_scale='RdYlGn',
        title="States by Region (sized by adoption score)"
    )

    fig.update_layout(height=600)
    st.plotly_chart(fig, use_container_width=True)

def show_state_details(data):
    """Display state details tab"""
    st.header("State Details Explorer")

    state_details = data['state_details']

    # State selector
    states_list = sorted([s['state_name'] for s in state_details.values()])
    selected_state = st.selectbox("Select a State", states_list)

    # Find state data
    state_data = None
    for state, sdata in state_details.items():
        if sdata['state_name'] == selected_state:
            state_data = sdata
            break

    if state_data:
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Adoption Score", f"{state_data['adoption_score']:.3f}")

        with col2:
            st.metric("Adoption Level", state_data['adoption_level'])

        with col3:
            st.metric("Total Indicators", len(state_data['indicators']))

        st.markdown("---")

        # Indicators breakdown
        st.subheader("Policy Indicators")

        if state_data['indicators']:
            indicators_by_type = {}
            for ind in state_data['indicators']:
                ind_type = ind['type']
                if ind_type not in indicators_by_type:
                    indicators_by_type[ind_type] = []
                indicators_by_type[ind_type].append(ind)

            # Radar chart
            indicator_types = ['AI_CURRICULUM', 'AI_GUIDELINES', 'TEACHER_TRAINING',
                             'AI_TOOLS', 'ETHICS_POLICY', 'PILOT_PROGRAMS']

            values = [1 if ind_type in indicators_by_type else 0 for ind_type in indicator_types]

            fig = go.Figure()

            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=indicator_types,
                fill='toself',
                name=selected_state
            ))

            fig.update_layout(
                polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
                showlegend=False,
                title="Policy Indicators Coverage"
            )

            st.plotly_chart(fig, use_container_width=True)

            # Detailed indicators
            st.subheader("Indicator Details")

            for ind_type, indicators in indicators_by_type.items():
                with st.expander(f"{ind_type} ({len(indicators)} found)"):
                    for i, ind in enumerate(indicators, 1):
                        st.write(f"**{i}. {ind['description']}**")
                        st.write(f"Confidence: {ind['confidence_score']:.2f}")
                        st.write(f"Source: [{ind['source_url']}]({ind['source_url']})")
                        if ind['evidence']:
                            st.caption(f"Evidence: {ind['evidence']}")
                        st.markdown("---")
        else:
            st.info(f"No policy indicators found for {selected_state}")

def show_indicators_analysis(data):
    """Display indicators analysis tab"""
    st.header("Policy Indicators Analysis")

    state_details = data['state_details']

    # Count indicators by type across all states
    indicator_counts = {
        'AI_CURRICULUM': 0,
        'AI_GUIDELINES': 0,
        'TEACHER_TRAINING': 0,
        'AI_TOOLS': 0,
        'ETHICS_POLICY': 0,
        'PILOT_PROGRAMS': 0
    }

    states_with_indicator = {key: [] for key in indicator_counts.keys()}

    for state, state_data in state_details.items():
        for ind in state_data['indicators']:
            ind_type = ind['type']
            if ind_type in indicator_counts:
                indicator_counts[ind_type] += 1
                if state_data['state_name'] not in states_with_indicator[ind_type]:
                    states_with_indicator[ind_type].append(state_data['state_name'])

    # Overall indicator frequency
    st.subheader("Indicator Frequency Across States")

    ind_df = pd.DataFrame([
        {
            'Indicator Type': ind_type,
            'Count': count,
            'States': len(states_with_indicator[ind_type]),
            'Percentage': (len(states_with_indicator[ind_type]) / len(state_details)) * 100
        }
        for ind_type, count in indicator_counts.items()
    ]).sort_values('Count', ascending=False)

    col1, col2 = st.columns(2)

    with col1:
        fig = px.bar(
            ind_df,
            x='Indicator Type',
            y='States',
            title="Number of States with Each Indicator",
            color='States',
            color_continuous_scale='Viridis'
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = px.pie(
            ind_df,
            names='Indicator Type',
            values='Count',
            title="Distribution of Indicator Occurrences"
        )
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    # Heatmap
    st.subheader("State-Indicator Heatmap")

    # Create matrix
    indicator_types = list(indicator_counts.keys())
    states_list = sorted([s['state_name'] for s in state_details.values()],
                        key=lambda x: state_details[[k for k, v in state_details.items()
                                                     if v['state_name'] == x][0]]['adoption_score'],
                        reverse=True)

    matrix = []
    for state_name in states_list:
        state_key = [k for k, v in state_details.items() if v['state_name'] == state_name][0]
        state_data = state_details[state_key]

        row = []
        for ind_type in indicator_types:
            has_indicator = any(ind['type'] == ind_type for ind in state_data['indicators'])
            row.append(1 if has_indicator else 0)
        matrix.append(row)

    fig = go.Figure(data=go.Heatmap(
        z=matrix,
        x=indicator_types,
        y=states_list,
        colorscale='RdYlGn',
        showscale=False
    ))

    fig.update_layout(
        title="Policy Indicators by State",
        xaxis_title="Indicator Type",
        yaxis_title="State",
        height=max(600, len(states_list) * 20)
    )

    st.plotly_chart(fig, use_container_width=True)

def run_new_analysis(mode, max_depth, delay):
    """Run a new analysis"""
    with st.spinner("Running analysis... This may take several minutes."):
        try:
            analyzer = PolicyAnalyzer()
            analyzer.crawler.max_depth = max_depth
            analyzer.crawler.delay = delay

            if mode == "Quick Test (5 states)":
                states = ["California", "Texas", "New York", "Florida", "Massachusetts"]
                for state in states:
                    analyzer.analyze_state(state)

            summary = analyzer.generate_national_summary()
            regional_stats = analyzer.get_regional_analysis()

            reporter = PolicyReporter(output_dir="output")
            reporter.generate_full_report(analyzer.state_policies, summary, regional_stats)

            st.success("✅ Analysis complete! Please refresh the page to view new data.")

        except Exception as e:
            st.error(f"❌ Error during analysis: {str(e)}")

if __name__ == "__main__":
    main()
