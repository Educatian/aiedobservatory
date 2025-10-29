#!/usr/bin/env python3
"""
AI Education Policy Stats - Main Execution Script

This script crawls state education websites across the United States,
identifies AI education policy indicators, and generates comprehensive
reports on policy adoption levels.
"""

import argparse
import logging
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.analyzer import PolicyAnalyzer
from src.reporter import PolicyReporter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description='Analyze AI Education Policy adoption across US states'
    )
    parser.add_argument(
        '--states',
        nargs='+',
        help='Specific states to analyze (default: all states)'
    )
    parser.add_argument(
        '--config',
        default='config/state_sources.yaml',
        help='Path to state sources configuration file'
    )
    parser.add_argument(
        '--output',
        default='output',
        help='Output directory for reports and visualizations'
    )
    parser.add_argument(
        '--max-depth',
        type=int,
        default=2,
        help='Maximum crawl depth for each state website (default: 2)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay between requests in seconds (default: 1.0)'
    )
    parser.add_argument(
        '--quick-test',
        action='store_true',
        help='Run quick test with 5 states only'
    )

    args = parser.parse_args()

    try:
        # Initialize analyzer
        logger.info("Initializing AI Education Policy Analyzer...")
        analyzer = PolicyAnalyzer(config_path=args.config)

        # Update crawler settings
        analyzer.crawler.max_depth = args.max_depth
        analyzer.crawler.delay = args.delay

        # Determine which states to analyze
        if args.quick_test:
            test_states = ['California', 'Texas', 'New York', 'Florida', 'Massachusetts']
            logger.info(f"Running quick test with states: {', '.join(test_states)}")
            states_to_analyze = test_states
        elif args.states:
            states_to_analyze = args.states
            logger.info(f"Analyzing specified states: {', '.join(states_to_analyze)}")
        else:
            states_to_analyze = None
            logger.info("Analyzing all 50 states...")

        # Perform analysis
        if states_to_analyze:
            for state in states_to_analyze:
                try:
                    analyzer.analyze_state(state)
                except Exception as e:
                    logger.error(f"Error analyzing {state}: {str(e)}")
        else:
            analyzer.analyze_all_states()

        # Generate summary statistics
        logger.info("Generating national summary...")
        summary = analyzer.generate_national_summary()
        regional_stats = analyzer.get_regional_analysis()

        # Generate reports
        logger.info("Generating reports and visualizations...")
        reporter = PolicyReporter(output_dir=args.output)
        reporter.generate_full_report(
            analyzer.state_policies,
            summary,
            regional_stats
        )

        # Print summary
        print("\n" + "=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)
        print(f"Total states analyzed: {summary.total_states}")
        print(f"States with AI Ed policies: {summary.states_with_policies}")
        print(f"Average adoption score: {summary.average_adoption_score:.3f}")
        print(f"\nReports available in: {args.output}/")
        print("  - report.txt           : Comprehensive text report")
        print("  - data/state_policies.csv : State-by-state data")
        print("  - data/full_report.json   : Complete JSON export")
        print("  - charts/              : Visualizations")
        print("=" * 80)

        # Print top 5 states
        print("\nTop 5 States by AI Ed Policy Adoption:")
        rankings = analyzer.get_state_rankings()
        for i, (state, score, level) in enumerate(rankings[:5], 1):
            print(f"  {i}. {state:20s} - Score: {score:.3f} ({level})")

        logger.info("Analysis completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
