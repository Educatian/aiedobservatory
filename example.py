#!/usr/bin/env python3
"""
Example usage of the AI Education Policy Stats system

This script demonstrates how to use the system programmatically.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.analyzer import PolicyAnalyzer
from src.reporter import PolicyReporter


def example_single_state():
    """Example: Analyze a single state"""
    print("=" * 80)
    print("Example 1: Analyzing a single state (California)")
    print("=" * 80)

    # Initialize analyzer
    analyzer = PolicyAnalyzer()

    # Analyze California
    policy = analyzer.analyze_state("California")

    # Print results
    print(f"\nState: {policy.state_name}")
    print(f"Adoption Score: {policy.adoption_score:.3f}")
    print(f"Adoption Level: {policy.adoption_level.name}")
    print(f"Indicators Found: {len(policy.indicators)}")

    if policy.indicators:
        print("\nPolicy Indicators:")
        for ind in policy.indicators[:5]:  # Show first 5
            print(f"  - {ind.indicator_type}: {ind.description}")
            print(f"    Confidence: {ind.confidence_score:.2f}")
            print(f"    Source: {ind.source_url}")


def example_multiple_states():
    """Example: Analyze multiple states and compare"""
    print("\n" + "=" * 80)
    print("Example 2: Comparing multiple states")
    print("=" * 80)

    # Initialize analyzer
    analyzer = PolicyAnalyzer()

    # Analyze several states
    states_to_compare = ["California", "Texas", "New York"]

    print(f"\nAnalyzing: {', '.join(states_to_compare)}\n")

    for state_name in states_to_compare:
        try:
            policy = analyzer.analyze_state(state_name)
            print(f"{policy.state_name:15s} - Score: {policy.adoption_score:.3f} ({policy.adoption_level.name})")
        except Exception as e:
            print(f"{state_name:15s} - Error: {str(e)}")

    # Get rankings
    print("\nState Rankings:")
    rankings = analyzer.get_state_rankings()
    for i, (state, score, level) in enumerate(rankings, 1):
        print(f"  {i}. {state:20s} - {score:.3f} ({level})")


def example_full_analysis():
    """Example: Full analysis with reports"""
    print("\n" + "=" * 80)
    print("Example 3: Full analysis with report generation")
    print("=" * 80)

    # Initialize
    analyzer = PolicyAnalyzer()

    # Analyze a subset of states for demonstration
    test_states = ["California", "Texas", "New York", "Florida", "Massachusetts"]

    print(f"\nAnalyzing {len(test_states)} states...")
    for state in test_states:
        try:
            analyzer.analyze_state(state)
            print(f"  ✓ {state}")
        except Exception as e:
            print(f"  ✗ {state}: {str(e)}")

    # Generate summary
    summary = analyzer.generate_national_summary()
    regional_stats = analyzer.get_regional_analysis()

    # Print summary
    print(f"\nNational Summary:")
    print(f"  Total States: {summary.total_states}")
    print(f"  States with Policies: {summary.states_with_policies}")
    print(f"  Average Score: {summary.average_adoption_score:.3f}")

    print(f"\nAdoption Distribution:")
    for level, count in summary.adoption_distribution.items():
        if count > 0:
            print(f"  {level.name:15s}: {count} states")

    # Generate reports
    print(f"\nGenerating reports...")
    reporter = PolicyReporter(output_dir="output_example")
    reporter.generate_full_report(
        analyzer.state_policies,
        summary,
        regional_stats
    )

    print("\nReports generated in 'output_example/' directory")


def example_custom_scoring():
    """Example: Access detailed policy information"""
    print("\n" + "=" * 80)
    print("Example 4: Custom analysis of policy indicators")
    print("=" * 80)

    analyzer = PolicyAnalyzer()

    # Analyze a state
    state_name = "California"
    policy = analyzer.analyze_state(state_name)

    # Group indicators by type
    from collections import defaultdict
    indicators_by_type = defaultdict(list)

    for ind in policy.indicators:
        indicators_by_type[ind.indicator_type].append(ind)

    print(f"\nDetailed breakdown for {state_name}:")
    print(f"Overall Score: {policy.adoption_score:.3f}\n")

    for ind_type, indicators in indicators_by_type.items():
        print(f"{ind_type}:")
        print(f"  Count: {len(indicators)}")
        avg_confidence = sum(ind.confidence_score for ind in indicators) / len(indicators)
        print(f"  Average Confidence: {avg_confidence:.2f}")

        # Show best evidence
        best_indicator = max(indicators, key=lambda x: x.confidence_score)
        print(f"  Best Evidence: {best_indicator.evidence_text[:100]}...")
        print()


if __name__ == "__main__":
    print("\nAI Education Policy Stats - Usage Examples\n")

    # Run examples
    try:
        # Comment/uncomment examples as needed

        # example_single_state()
        # example_multiple_states()
        # example_full_analysis()
        # example_custom_scoring()

        print("\n" + "=" * 80)
        print("To run examples, uncomment the desired function calls in example.py")
        print("=" * 80)
        print("\nAvailable examples:")
        print("  1. example_single_state()     - Analyze one state")
        print("  2. example_multiple_states()  - Compare multiple states")
        print("  3. example_full_analysis()    - Generate complete reports")
        print("  4. example_custom_scoring()   - Custom indicator analysis")

    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
