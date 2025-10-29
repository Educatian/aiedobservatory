#!/usr/bin/env python3
"""
Demo mode - Shows system capabilities with simulated data

This demonstrates what the output looks like when policy indicators are found.
Since many state websites have bot protection, this uses mock data to show
the full reporting capabilities.
"""
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from src.models import StatePolicy, PolicyIndicator, PolicyAdoptionLevel, NationalSummary
from src.reporter import PolicyReporter

print("=" * 80)
print("AI Education Policy Stats - DEMO MODE")
print("=" * 80)
print("\nGenerating simulated data to demonstrate system capabilities...\n")

# Create simulated state policies
def create_demo_state(name, abbr, score_multiplier):
    """Create a demo state with realistic indicators"""
    policy = StatePolicy(state_name=name, state_abbr=abbr)

    # Add various indicators based on score multiplier
    if score_multiplier > 0.2:
        policy.indicators.append(PolicyIndicator(
            indicator_type="AI_GUIDELINES",
            description=f"AI usage guidelines for {name} schools",
            source_url=f"https://education.{abbr.lower()}.gov/ai-policy",
            confidence_score=0.85,
            evidence_text=f"The {name} Department of Education has established comprehensive guidelines for artificial intelligence use in K-12 classrooms..."
        ))

    if score_multiplier > 0.4:
        policy.indicators.append(PolicyIndicator(
            indicator_type="AI_CURRICULUM",
            description=f"AI curriculum framework for {name}",
            source_url=f"https://education.{abbr.lower()}.gov/curriculum/ai",
            confidence_score=0.78,
            evidence_text=f"Standards for AI education including machine learning concepts, ethical considerations, and practical applications..."
        ))

    if score_multiplier > 0.5:
        policy.indicators.append(PolicyIndicator(
            indicator_type="TEACHER_TRAINING",
            description=f"Professional development in AI for {name} teachers",
            source_url=f"https://education.{abbr.lower()}.gov/training",
            confidence_score=0.72,
            evidence_text=f"Teacher training programs focus on integrating AI tools, understanding AI ethics, and developing AI literacy..."
        ))

    if score_multiplier > 0.7:
        policy.indicators.append(PolicyIndicator(
            indicator_type="AI_TOOLS",
            description=f"Approved AI tools list for {name} districts",
            source_url=f"https://education.{abbr.lower()}.gov/technology",
            confidence_score=0.80,
            evidence_text=f"Districts may use approved AI educational tools including adaptive learning platforms, tutoring systems..."
        ))

    if score_multiplier > 0.8:
        policy.indicators.append(PolicyIndicator(
            indicator_type="ETHICS_POLICY",
            description=f"AI ethics framework for {name} education",
            source_url=f"https://education.{abbr.lower()}.gov/ethics",
            confidence_score=0.88,
            evidence_text=f"Ethical framework addresses bias, privacy, transparency, and responsible AI use in educational settings..."
        ))

        policy.indicators.append(PolicyIndicator(
            indicator_type="PILOT_PROGRAMS",
            description=f"AI pilot programs in {name} schools",
            source_url=f"https://education.{abbr.lower()}.gov/pilots",
            confidence_score=0.75,
            evidence_text=f"Pilot programs testing AI tutoring, personalized learning, and administrative automation in select districts..."
        ))

    policy.calculate_adoption_score()
    policy.determine_adoption_level()

    return policy

# Create demo dataset with varying adoption levels
demo_states = {
    "California": create_demo_state("California", "CA", 0.9),
    "Massachusetts": create_demo_state("Massachusetts", "MA", 0.85),
    "Texas": create_demo_state("Texas", "TX", 0.75),
    "New York": create_demo_state("New York", "NY", 0.72),
    "Virginia": create_demo_state("Virginia", "VA", 0.68),
    "Colorado": create_demo_state("Colorado", "CO", 0.65),
    "Washington": create_demo_state("Washington", "WA", 0.62),
    "Illinois": create_demo_state("Illinois", "IL", 0.58),
    "Florida": create_demo_state("Florida", "FL", 0.55),
    "Ohio": create_demo_state("Ohio", "OH", 0.48),
    "Pennsylvania": create_demo_state("Pennsylvania", "PA", 0.45),
    "Georgia": create_demo_state("Georgia", "GA", 0.42),
    "Michigan": create_demo_state("Michigan", "MI", 0.38),
    "Arizona": create_demo_state("Arizona", "AZ", 0.35),
    "North Carolina": create_demo_state("North Carolina", "NC", 0.32),
    "Indiana": create_demo_state("Indiana", "IN", 0.28),
    "Wisconsin": create_demo_state("Wisconsin", "WI", 0.25),
    "Minnesota": create_demo_state("Minnesota", "MN", 0.22),
    "Nevada": create_demo_state("Nevada", "NV", 0.18),
    "Utah": create_demo_state("Utah", "UT", 0.15),
}

# Generate summary
total_states = len(demo_states)
states_with_policies = sum(1 for p in demo_states.values() if p.adoption_level != PolicyAdoptionLevel.NONE)
avg_score = sum(p.adoption_score for p in demo_states.values()) / total_states

distribution = {level: 0 for level in PolicyAdoptionLevel}
for policy in demo_states.values():
    distribution[policy.adoption_level] += 1

sorted_states = sorted(demo_states.items(), key=lambda x: x[1].adoption_score, reverse=True)
leading_states = [state for state, policy in sorted_states[:10]]

summary = NationalSummary(
    total_states=total_states,
    states_with_policies=states_with_policies,
    average_adoption_score=avg_score,
    adoption_distribution=distribution,
    leading_states=leading_states
)

# Regional stats (simplified)
regional_stats = {
    "West": {"average_score": 0.65, "total_states": 5, "states_with_policies": 4, "adoption_rate": 0.8},
    "Northeast": {"average_score": 0.58, "total_states": 4, "states_with_policies": 3, "adoption_rate": 0.75},
    "South": {"average_score": 0.42, "total_states": 6, "states_with_policies": 4, "adoption_rate": 0.67},
    "Midwest": {"average_score": 0.38, "total_states": 5, "states_with_policies": 3, "adoption_rate": 0.6}
}

# Print summary
print("DEMO NATIONAL SUMMARY")
print("-" * 80)
print(f"States Analyzed: {total_states}")
print(f"States with AI Ed Policies: {states_with_policies}")
print(f"Average Adoption Score: {avg_score:.3f}")
print()

print("Top 10 States (Simulated Data):")
for i, (state, policy) in enumerate(sorted_states[:10], 1):
    print(f"  {i:2d}. {policy.state_name:20s} - Score: {policy.adoption_score:.3f} ({policy.adoption_level.name})")
print()

# Generate reports
print("Generating full reports and visualizations...")
reporter = PolicyReporter(output_dir="output_demo")
reporter.generate_full_report(demo_states, summary, regional_stats)

print("\n" + "=" * 80)
print("DEMO COMPLETE!")
print("=" * 80)
print("\nGenerated demo reports in: output_demo/")
print("  - report.txt              : Text report")
print("  - data/state_policies.csv : CSV data")
print("  - data/full_report.json   : JSON export")
print("  - charts/*.png            : Visualizations")
print()
print("NOTE: This demo uses simulated data to show system capabilities.")
print("Real crawling may encounter:")
print("  - Bot protection (403 errors)")
print("  - Rate limiting")
print("  - Timeouts")
print()
print("For better results with real data:")
print("  1. Use longer delays: --delay 2.0")
print("  2. Crawl during off-peak hours")
print("  3. Some states may require manual data entry")
print("=" * 80)
