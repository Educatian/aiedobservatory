#!/usr/bin/env python3
"""
Quick test run to verify the system works
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.analyzer import PolicyAnalyzer
from src.reporter import PolicyReporter

print("=" * 80)
print("AI Education Policy Stats - Test Run")
print("=" * 80)
print("\nTesting with California (limited crawl depth)...\n")

try:
    # Initialize analyzer
    analyzer = PolicyAnalyzer()

    # Set minimal crawl parameters for quick test
    analyzer.crawler.max_depth = 1
    analyzer.crawler.delay = 0.5

    # Analyze California
    print("Crawling California education department website...")
    policy = analyzer.analyze_state("California")

    # Display results
    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80)
    print(f"State: {policy.state_name}")
    print(f"Adoption Score: {policy.adoption_score:.3f}")
    print(f"Adoption Level: {policy.adoption_level.name}")
    print(f"Indicators Found: {len(policy.indicators)}")

    if policy.indicators:
        print(f"\nPolicy Indicators Detected:")
        for i, ind in enumerate(policy.indicators[:10], 1):  # Show first 10
            print(f"\n  {i}. {ind.indicator_type}")
            print(f"     Confidence: {ind.confidence_score:.2f}")
            print(f"     Source: {ind.source_url}")
            if ind.evidence_text:
                print(f"     Evidence: {ind.evidence_text[:100]}...")
    else:
        print("\n  No indicators found (this is normal for a quick test)")
        print("  For better results, increase max_depth and analyze multiple states")

    print("\n" + "=" * 80)
    print("TEST COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print("\nTo run full analysis:")
    print("  python main.py --quick-test    # Test with 5 states")
    print("  python main.py                 # Analyze all 50 states")

except Exception as e:
    print(f"\nError during test: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
