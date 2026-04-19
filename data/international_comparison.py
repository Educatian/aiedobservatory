"""International comparison data - South Korea and G7 baselines"""
from src.models import InternationalComparison

KOREA_POLICY = InternationalComparison(
    country_name="South Korea",
    country_code="KR",
    adoption_score=0.85,
    key_policies=[
        "National AI Strategy (2019)",
        "Mandatory AI Curriculum K-12 (2020-2025)",
        "50K+ Teacher AI Training Program (2021)",
        "AI Ethics Guidelines for Schools (2022)",
        "AI Textbook Development Project",
        "AI Education Research Center Network",
    ],
    population_million=51.7,
    gdp_per_capita=34000,
    education_spending_pct=5.1,
    notes=(
        "South Korea is a global leader in AI education:\n"
        "- Mandatory AI curriculum from elementary to high school (2025)\n"
        "- 50,000+ teachers trained in AI education\n"
        "- Government investment: $250M (2020-2025)\n"
        "- Public-private partnerships: Samsung, Naver, Kakao\n"
        "- Strong AI ethics integration from early grades"
    ),
)

G7_COUNTRIES = [
    InternationalComparison(country_name="Japan", country_code="JP",
        adoption_score=0.78, population_million=125.0,
        key_policies=["Society 5.0 Education", "GIGA School Program", "AI Textbook Initiative"]),
    InternationalComparison(country_name="France", country_code="FR",
        adoption_score=0.72, population_million=67.0,
        key_policies=["AI for Humanity Strategy", "Digital Education Plan"]),
    InternationalComparison(country_name="United Kingdom", country_code="UK",
        adoption_score=0.75, population_million=67.0,
        key_policies=["National Centre for Computing Education", "AI in Education Strategy"]),
    InternationalComparison(country_name="Canada", country_code="CA",
        adoption_score=0.70, population_million=38.0,
        key_policies=["Pan-Canadian AI Strategy", "Digital Literacy Framework"]),
    InternationalComparison(country_name="Germany", country_code="DE",
        adoption_score=0.68, population_million=83.0,
        key_policies=["AI Action Plan for Education", "Digital Education Platform"]),
    InternationalComparison(country_name="Italy", country_code="IT",
        adoption_score=0.58, population_million=60.0,
        key_policies=["National Digital School Plan", "AI Strategy for Education"]),
]


def compare_us_to_korea(us_avg_score: float) -> dict:
    gap = KOREA_POLICY.adoption_score - us_avg_score
    return {
        "us_score": us_avg_score,
        "korea_score": KOREA_POLICY.adoption_score,
        "gap": gap,
        "gap_percentage": (gap / KOREA_POLICY.adoption_score) * 100,
        "comparison": "behind" if gap > 0 else "ahead",
        "recommendations": [
            "Develop mandatory AI curriculum standards (Korea: implemented 2020)",
            "Launch large-scale teacher AI training (Korea: 50K+ teachers)",
            "Establish public-private tech partnerships (Samsung, Naver model)",
            "Create dedicated AI education research centers",
            "Integrate AI ethics from elementary level",
            "Provide sustained government funding ($250M over 5 years in Korea)",
        ] if gap > 0 else [],
    }
