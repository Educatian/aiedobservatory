"""
Data models for AI Education Policy tracking
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum


class PolicyAdoptionLevel(Enum):
    """Levels of AI Education Policy Adoption"""
    NONE = 0
    EMERGING = 1
    DEVELOPING = 2
    ESTABLISHED = 3
    LEADING = 4


@dataclass
class PolicyIndicator:
    """Individual policy indicator found in state documents"""
    indicator_type: str  # e.g., "AI_CURRICULUM", "AI_GUIDELINES", "TEACHER_TRAINING"
    description: str
    source_url: str
    confidence_score: float  # 0.0 to 1.0
    date_found: datetime = field(default_factory=datetime.now)
    evidence_text: Optional[str] = None


@dataclass
class StatePolicy:
    """Complete AI Education Policy information for a state"""
    state_name: str
    state_abbr: str
    indicators: List[PolicyIndicator] = field(default_factory=list)
    adoption_score: float = 0.0
    adoption_level: PolicyAdoptionLevel = PolicyAdoptionLevel.NONE
    last_updated: datetime = field(default_factory=datetime.now)
    notes: str = ""

    def calculate_adoption_score(self) -> float:
        """Calculate overall adoption score based on indicators"""
        if not self.indicators:
            return 0.0

        # Weight different indicator types
        weights = {
            "AI_CURRICULUM": 0.25,
            "AI_GUIDELINES": 0.20,
            "TEACHER_TRAINING": 0.20,
            "AI_TOOLS": 0.15,
            "ETHICS_POLICY": 0.10,
            "PILOT_PROGRAMS": 0.10
        }

        score = 0.0
        indicator_types_found = set()

        for indicator in self.indicators:
            if indicator.indicator_type in weights:
                # Only count each indicator type once (take highest confidence)
                if indicator.indicator_type not in indicator_types_found:
                    score += weights[indicator.indicator_type] * indicator.confidence_score
                    indicator_types_found.add(indicator.indicator_type)
                else:
                    # Update if higher confidence found
                    existing_score = weights[indicator.indicator_type] * indicator.confidence_score
                    score = max(score, existing_score)

        self.adoption_score = score
        return score

    def determine_adoption_level(self) -> PolicyAdoptionLevel:
        """Determine adoption level based on score"""
        score = self.calculate_adoption_score()

        if score >= 0.8:
            level = PolicyAdoptionLevel.LEADING
        elif score >= 0.6:
            level = PolicyAdoptionLevel.ESTABLISHED
        elif score >= 0.4:
            level = PolicyAdoptionLevel.DEVELOPING
        elif score >= 0.2:
            level = PolicyAdoptionLevel.EMERGING
        else:
            level = PolicyAdoptionLevel.NONE

        self.adoption_level = level
        return level


@dataclass
class NationalSummary:
    """Summary statistics for national AI education policy adoption"""
    total_states: int
    states_with_policies: int
    average_adoption_score: float
    adoption_distribution: Dict[PolicyAdoptionLevel, int]
    leading_states: List[str]
    timestamp: datetime = field(default_factory=datetime.now)
