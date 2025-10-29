"""
Analysis and scoring system for AI education policy adoption
"""
import yaml
from typing import List, Dict
import logging
from datetime import datetime

from .models import StatePolicy, PolicyIndicator, PolicyAdoptionLevel, NationalSummary
from .crawler import PolicyCrawler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PolicyAnalyzer:
    """Analyzes AI education policy adoption across states"""

    def __init__(self, config_path: str = "config/state_sources.yaml"):
        """Initialize analyzer with state configuration"""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)

        self.crawler = PolicyCrawler(max_depth=2, delay=1.0)
        self.state_policies: Dict[str, StatePolicy] = {}

    def analyze_state(self, state_name: str) -> StatePolicy:
        """
        Analyze a single state's AI education policy

        Args:
            state_name: Name of the state to analyze

        Returns:
            StatePolicy object with analysis results
        """
        if state_name not in self.config['states']:
            raise ValueError(f"State '{state_name}' not found in configuration")

        state_config = self.config['states'][state_name]

        logger.info(f"Analyzing {state_name}...")

        # Crawl state website for policy indicators
        indicators = self.crawler.crawl_state(
            state_name=state_config['name'],
            base_url=state_config['education_dept'],
            keywords=state_config['policy_keywords']
        )

        # Create state policy object
        policy = StatePolicy(
            state_name=state_config['name'],
            state_abbr=state_config['abbr'],
            indicators=indicators
        )

        # Calculate scores
        policy.calculate_adoption_score()
        policy.determine_adoption_level()

        self.state_policies[state_name] = policy

        logger.info(
            f"{state_name}: Score={policy.adoption_score:.2f}, "
            f"Level={policy.adoption_level.name}"
        )

        return policy

    def analyze_all_states(self) -> Dict[str, StatePolicy]:
        """
        Analyze all states in configuration

        Returns:
            Dictionary of state policies
        """
        logger.info("Starting analysis of all states...")

        for state_name in self.config['states'].keys():
            try:
                self.analyze_state(state_name)
            except Exception as e:
                logger.error(f"Error analyzing {state_name}: {str(e)}")
                # Create empty policy for failed states
                state_config = self.config['states'][state_name]
                self.state_policies[state_name] = StatePolicy(
                    state_name=state_config['name'],
                    state_abbr=state_config['abbr'],
                    notes=f"Error during analysis: {str(e)}"
                )

        logger.info(f"Completed analysis of {len(self.state_policies)} states")
        return self.state_policies

    def generate_national_summary(self) -> NationalSummary:
        """
        Generate summary statistics for national adoption

        Returns:
            NationalSummary object
        """
        if not self.state_policies:
            raise ValueError("No state policies analyzed yet")

        total_states = len(self.state_policies)
        states_with_policies = sum(
            1 for p in self.state_policies.values()
            if p.adoption_level != PolicyAdoptionLevel.NONE
        )

        # Calculate average adoption score
        total_score = sum(p.adoption_score for p in self.state_policies.values())
        avg_score = total_score / total_states if total_states > 0 else 0

        # Distribution by adoption level
        distribution = {level: 0 for level in PolicyAdoptionLevel}
        for policy in self.state_policies.values():
            distribution[policy.adoption_level] += 1

        # Identify leading states
        sorted_states = sorted(
            self.state_policies.items(),
            key=lambda x: x[1].adoption_score,
            reverse=True
        )
        leading_states = [
            state for state, policy in sorted_states[:10]
            if policy.adoption_score > 0
        ]

        summary = NationalSummary(
            total_states=total_states,
            states_with_policies=states_with_policies,
            average_adoption_score=avg_score,
            adoption_distribution=distribution,
            leading_states=leading_states
        )

        return summary

    def get_state_rankings(self) -> List[tuple]:
        """
        Get states ranked by adoption score

        Returns:
            List of (state_name, score, level) tuples
        """
        rankings = [
            (
                policy.state_name,
                policy.adoption_score,
                policy.adoption_level.name
            )
            for policy in self.state_policies.values()
        ]

        return sorted(rankings, key=lambda x: x[1], reverse=True)

    def get_regional_analysis(self) -> Dict[str, Dict]:
        """
        Analyze adoption by US region

        Returns:
            Dictionary of regional statistics
        """
        # US regions mapping
        regions = {
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

        regional_stats = {}

        for region, states in regions.items():
            region_policies = [
                self.state_policies[state]
                for state in states
                if state in self.state_policies
            ]

            if region_policies:
                avg_score = sum(p.adoption_score for p in region_policies) / len(region_policies)
                states_with_policies = sum(
                    1 for p in region_policies
                    if p.adoption_level != PolicyAdoptionLevel.NONE
                )

                regional_stats[region] = {
                    "average_score": avg_score,
                    "total_states": len(region_policies),
                    "states_with_policies": states_with_policies,
                    "adoption_rate": states_with_policies / len(region_policies)
                }

        return regional_stats
