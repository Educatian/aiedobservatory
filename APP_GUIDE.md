# AI Education Policy Stats - Visualization App Guide

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Demo Data (if not already done)

```bash
python3 demo.py
```

### 3. Launch the Dashboard

```bash
# Easy way - using launch script
bash run_app.sh

# Or directly
streamlit run app.py
```

The dashboard will open automatically in your browser at `http://localhost:8501`

## Dashboard Features

### 📊 Overview Tab

**What you'll see:**
- Key metrics: total states, adoption rate, average score
- Adoption level distribution pie chart
- Top 10 leading states table
- Complete state-by-state bar chart

**Use cases:**
- Get a quick snapshot of national AI ed policy landscape
- Identify leading states
- Understand overall adoption levels

### 🗺️ State Rankings Tab

**What you'll see:**
- Sortable, filterable table of all states
- Filters by region, adoption level, and minimum indicators
- Interactive horizontal bar chart
- Adjustable top-N display

**Use cases:**
- Compare specific groups of states
- Find states in a particular region
- Filter by adoption criteria
- Export data for reports

### 🌎 Regional Analysis Tab

**What you'll see:**
- Regional comparison metrics
- Average scores by region
- Adoption rates by region
- Sunburst chart showing state distribution

**Use cases:**
- Compare regions of the US
- Identify regional trends
- Understand geographic patterns in policy adoption

### 🔍 State Details Tab

**What you'll see:**
- Detailed view of individual states
- State-specific metrics
- Radar chart of policy indicator coverage
- Evidence and sources for each indicator

**Use cases:**
- Deep dive into a specific state
- Review evidence for policy indicators
- Understand what types of policies a state has
- Access source URLs

### 📈 Indicators Analysis Tab

**What you'll see:**
- Frequency of each indicator type
- Heatmap showing which states have which indicators
- Distribution of indicator occurrences
- Percentage coverage across states

**Use cases:**
- Understand which policy types are most common
- Identify gaps in policy coverage
- Compare indicator adoption patterns

## Interactive Features

### Filtering and Selection

- **Multi-select filters**: Choose multiple regions or levels
- **Sliders**: Adjust thresholds and display counts
- **Dropdowns**: Select specific states for detailed view

### Visualizations

All charts are interactive:
- **Hover**: See detailed information
- **Zoom**: Click and drag to zoom into areas
- **Pan**: Move around zoomed views
- **Download**: Use the camera icon to save charts

### Data Export

- **CSV Export**: Available from most tables
- **Chart Images**: Download any chart as PNG
- **Full Screen**: Expand any chart for presentations

## Running New Analysis

You can run new analyses directly from the app:

1. Go to the sidebar
2. Select "Run New Analysis"
3. Choose analysis mode:
   - Quick Test (5 states)
   - Custom States (select specific states)
   - All States (full 50-state analysis)
4. Adjust crawl depth and delay
5. Click "🚀 Run Analysis"

**Note**: Running analysis from the app may take time and encounter website restrictions.

## Tips for Best Experience

### Performance

- Demo data loads instantly
- Full analysis takes 30-60 minutes
- Use filters to focus on relevant data
- Close unused tabs to improve performance

### Visualization

- Use full-screen mode for presentations
- Download charts for reports and papers
- Adjust chart settings using Plotly controls
- Try different color schemes in the code

### Data Analysis

- Compare multiple regions side-by-side
- Track specific indicator types
- Export filtered data for further analysis
- Use the state details tab for citations

## Customization

### Changing Colors

Edit `app.py` and modify the color maps:

```python
color_discrete_map={
    'NONE': '#95a5a6',
    'EMERGING': '#e74c3c',
    'DEVELOPING': '#f39c12',
    'ESTABLISHED': '#3498db',
    'LEADING': '#2ecc71'
}
```

### Adding New Visualizations

The app uses Plotly - add new charts in the relevant tab function:

```python
def show_custom_tab(data):
    st.header("My Custom Analysis")
    fig = px.scatter(df, x='score', y='indicators')
    st.plotly_chart(fig, use_container_width=True)
```

### Modifying Layout

Adjust the page configuration at the top of `app.py`:

```python
st.set_page_config(
    page_title="Your Title",
    page_icon="🎓",
    layout="wide"  # or "centered"
)
```

## Troubleshooting

### App Won't Start

```bash
# Reinstall Streamlit
pip install --upgrade streamlit

# Clear cache
streamlit cache clear

# Check port availability
lsof -i :8501
```

### Data Not Loading

```bash
# Regenerate demo data
python3 demo.py

# Check file exists
ls -l output_demo/data/full_report.json
```

### Slow Performance

- Use filters to reduce data displayed
- Close unused browser tabs
- Restart the Streamlit server
- Clear browser cache

### Charts Not Displaying

```bash
# Update Plotly
pip install --upgrade plotly

# Try different browser (Chrome recommended)
```

## Deployment

### Local Network Access

Allow others on your network to access:

```bash
streamlit run app.py --server.address 0.0.0.0
```

### Cloud Deployment

Deploy to Streamlit Cloud:

1. Push code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your repository
4. Deploy!

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py"]
```

## API Integration

The app can be extended to provide API endpoints:

```python
# Add to app.py
@st.cache_data
def get_api_data(state_name):
    return state_details[state_name]
```

## Data Updates

To update with fresh data:

1. Run new analysis: `python3 main.py`
2. Output goes to `output/` directory
3. Update app to read from `output/` instead of `output_demo/`
4. Refresh browser

## Best Practices

### For Research

- Always cite data sources
- Note the analysis date
- Document methodology
- Export data for reproducibility

### For Presentations

- Use full-screen mode
- Download high-quality chart images
- Prepare filtered views ahead of time
- Test on presentation computer

### For Reports

- Export tables to CSV
- Include methodology section
- Reference source URLs
- Note any limitations

## Getting Help

- Check logs in terminal where Streamlit is running
- Use browser developer console (F12)
- Review Streamlit docs: [docs.streamlit.io](https://docs.streamlit.io)
- Check Plotly docs: [plotly.com/python](https://plotly.com/python)

## Next Steps

- Customize visualizations for your needs
- Add new analysis tabs
- Integrate with other data sources
- Deploy to share with others
- Build automated reports

---

For more information, see the main [README.md](README.md)
