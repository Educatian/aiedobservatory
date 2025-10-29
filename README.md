# AI Education Policy Stats

A comprehensive system for crawling, analyzing, and reporting on AI education policy adoption across all 50 US states.

## Overview

This project automatically:
- Crawls state education department websites
- Identifies AI education policy indicators
- Scores states on policy adoption levels
- Generates detailed reports and visualizations

## Features

### Policy Indicators Tracked

The system identifies six key types of AI education policy indicators:

1. **AI Curriculum** - Formal AI curriculum standards and courses
2. **AI Guidelines** - Official guidelines for AI use in education
3. **Teacher Training** - Professional development programs for educators
4. **AI Tools** - Approved AI tools and educational technology
5. **Ethics Policy** - Ethical guidelines for AI in schools
6. **Pilot Programs** - AI education pilot projects and initiatives

### Adoption Levels

States are classified into five adoption levels based on their policy indicators:

- **LEADING** (Score: 0.8-1.0) - Comprehensive AI education policies
- **ESTABLISHED** (Score: 0.6-0.8) - Strong policy framework in place
- **DEVELOPING** (Score: 0.4-0.6) - Emerging policy development
- **EMERGING** (Score: 0.2-0.4) - Initial policy exploration
- **NONE** (Score: 0.0-0.2) - No identifiable AI education policies

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd aiedpolicystats
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Analyze All States

Run a complete analysis of all 50 US states:

```bash
python main.py
```

### Quick Test

Run a quick test with 5 representative states:

```bash
python main.py --quick-test
```

### Analyze Specific States

Analyze only specific states:

```bash
python main.py --states California Texas "New York" Florida
```

### Advanced Options

```bash
python main.py \
  --states California Texas \
  --output custom_output_dir \
  --max-depth 3 \
  --delay 2.0
```

#### Options:

- `--states`: List of specific states to analyze (default: all states)
- `--config`: Path to state sources configuration (default: `config/state_sources.yaml`)
- `--output`: Output directory for reports (default: `output`)
- `--max-depth`: Maximum website crawl depth (default: 2)
- `--delay`: Delay between requests in seconds (default: 1.0)
- `--quick-test`: Run quick test with 5 states

## Output

The system generates comprehensive reports in the output directory:

### Data Files

- **`data/state_policies.csv`** - Spreadsheet with state-by-state data
- **`data/full_report.json`** - Complete JSON export with all details

### Visualizations

- **`charts/state_rankings.png`** - Top 20 states by adoption score
- **`charts/adoption_distribution.png`** - Pie chart of adoption levels
- **`charts/regional_comparison.png`** - Regional statistics comparison
- **`charts/indicator_heatmap.png`** - Heatmap of policy indicators by state

### Reports

- **`report.txt`** - Comprehensive text report with:
  - National summary statistics
  - Top performing states
  - Regional analysis
  - Detailed state breakdowns

## Project Structure

```
aiedpolicystats/
├── config/
│   └── state_sources.yaml      # State education department URLs
├── src/
│   ├── __init__.py
│   ├── models.py               # Data models
│   ├── crawler.py              # Web crawling logic
│   ├── analyzer.py             # Policy analysis and scoring
│   └── reporter.py             # Report generation
├── output/                     # Generated reports (created at runtime)
│   ├── data/
│   └── charts/
├── main.py                     # Main execution script
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## How It Works

### 1. Web Crawling

The system crawls state education department websites up to a specified depth, looking for pages related to:
- AI policy
- Technology plans
- Digital learning initiatives
- Educational technology

### 2. Policy Detection

Using pattern matching and natural language processing, the system identifies references to:
- AI curriculum and standards
- Policy guidelines
- Training programs
- Implementation initiatives

### 3. Scoring System

Each state receives a score (0.0-1.0) based on:
- Number and type of policy indicators found
- Confidence in the findings
- Weighted importance of different indicator types

### 4. Analysis

The system provides:
- State rankings
- Regional comparisons (Northeast, Midwest, South, West)
- National adoption statistics
- Trend analysis

## Methodology

### Confidence Scoring

Policy indicators are assigned confidence scores based on:
- Official policy language (higher confidence)
- Educational context (higher confidence)
- Multiple keyword matches (higher confidence)
- Source page relevance (higher confidence)

### Adoption Score Calculation

State adoption scores are calculated using weighted indicators:
- AI Curriculum: 25%
- AI Guidelines: 20%
- Teacher Training: 20%
- AI Tools: 15%
- Ethics Policy: 10%
- Pilot Programs: 10%

## Limitations

- The system performs automated web crawling and may not capture all policies
- Policy detection relies on publicly available information
- Crawling respects robots.txt and implements delays to be server-friendly
- Some states may have policies not published on their education websites
- Manual verification of results is recommended for critical decisions

## Data Sources

All data is collected from official state education department websites. URLs are maintained in `config/state_sources.yaml`.

## Contributing

To add or update state sources:

1. Edit `config/state_sources.yaml`
2. Add/update state education department URLs
3. Customize policy keywords if needed

## Ethical Considerations

This tool is designed for:
- Educational research
- Policy analysis
- Understanding AI adoption in education

Please use responsibly:
- Respect website robots.txt files
- Use appropriate delays between requests
- Do not overload state servers
- Cite sources appropriately

## License

This project is intended for educational and research purposes.

## Support

For issues, questions, or contributions, please open an issue in the repository.

## Future Enhancements

Potential improvements:
- PDF document parsing for policy documents
- Historical trend tracking
- International education system analysis
- Machine learning for improved policy detection
- Real-time dashboard
- API for programmatic access

## Acknowledgments

This project analyzes publicly available information from state education departments to support research on AI adoption in education policy.
