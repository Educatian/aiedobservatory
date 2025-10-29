# Quick Start Guide

Get started with AI Education Policy Stats in 5 minutes!

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Quick Test

Run a quick analysis with 5 states (takes ~5-10 minutes):

```bash
python main.py --quick-test
```

This will analyze: California, Texas, New York, Florida, and Massachusetts.

## View Results

After the analysis completes, check the `output/` directory:

```bash
# View the text report
cat output/report.txt

# View the CSV data
less output/data/state_policies.csv

# View visualizations (requires image viewer)
open output/charts/state_rankings.png
```

## Run Full Analysis

To analyze all 50 states (takes 1-2 hours):

```bash
python main.py
```

**Note**: This crawls 50 state websites. Be patient and respectful of server resources.

## Analyze Specific States

```bash
# Single state
python main.py --states California

# Multiple states
python main.py --states California Texas "New York" Florida
```

## Common Issues

### Import Errors

Make sure you're in the project directory and have installed dependencies:
```bash
cd aiedpolicystats
pip install -r requirements.txt
```

### Network Timeouts

Some state websites may be slow or temporarily unavailable. The system will:
- Log errors for failed states
- Continue with other states
- Include error information in the report

### Adjusting Crawl Settings

If you experience timeouts, increase the delay:
```bash
python main.py --delay 2.0 --max-depth 1
```

## Understanding Results

### Adoption Scores

- **0.8-1.0**: LEADING - Comprehensive AI ed policy
- **0.6-0.8**: ESTABLISHED - Strong policy framework
- **0.4-0.6**: DEVELOPING - Emerging policies
- **0.2-0.4**: EMERGING - Initial exploration
- **0.0-0.2**: NONE - No identifiable policies

### Output Files

1. **report.txt**: Start here! Human-readable summary
2. **state_policies.csv**: Great for Excel/spreadsheet analysis
3. **full_report.json**: Complete data for programming/APIs
4. **charts/**: Visual representations of the data

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [example.py](example.py) for programmatic usage
- Customize [config/state_sources.yaml](config/state_sources.yaml) for different search parameters

## Need Help?

Check the README.md for:
- Detailed usage instructions
- Command-line options
- Project methodology
- Contributing guidelines
