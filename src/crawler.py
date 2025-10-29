"""
Web crawler for AI education policy documents
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Set
import time
import re
from datetime import datetime
import logging
from urllib.parse import urljoin, urlparse

from .models import PolicyIndicator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PolicyCrawler:
    """Crawls state education websites for AI policy information"""

    def __init__(self, max_depth: int = 2, delay: float = 1.0):
        self.max_depth = max_depth
        self.delay = delay
        self.visited_urls: Set[str] = set()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Educational Research Bot) AI-Ed-Policy-Crawler/1.0'
        })

    def crawl_state(self, state_name: str, base_url: str, keywords: List[str]) -> List[PolicyIndicator]:
        """
        Crawl a state education website for AI policy indicators

        Args:
            state_name: Name of the state
            base_url: Base URL of state education department
            keywords: Keywords to search for

        Returns:
            List of policy indicators found
        """
        logger.info(f"Starting crawl for {state_name}: {base_url}")

        indicators = []
        urls_to_crawl = [(base_url, 0)]  # (url, depth)
        self.visited_urls = set()

        while urls_to_crawl:
            current_url, depth = urls_to_crawl.pop(0)

            if current_url in self.visited_urls or depth > self.max_depth:
                continue

            self.visited_urls.add(current_url)

            try:
                logger.info(f"Crawling: {current_url} (depth: {depth})")

                # Fetch page
                response = self.session.get(current_url, timeout=10)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')

                # Search for policy indicators
                found_indicators = self._extract_indicators(
                    soup, current_url, keywords, state_name
                )
                indicators.extend(found_indicators)

                # Find related links to follow
                if depth < self.max_depth:
                    links = self._extract_relevant_links(soup, base_url, keywords)
                    for link in links[:5]:  # Limit links per page
                        if link not in self.visited_urls:
                            urls_to_crawl.append((link, depth + 1))

                # Be polite - delay between requests
                time.sleep(self.delay)

            except Exception as e:
                logger.error(f"Error crawling {current_url}: {str(e)}")
                continue

        logger.info(f"Completed crawl for {state_name}. Found {len(indicators)} indicators.")
        return indicators

    def _extract_indicators(
        self,
        soup: BeautifulSoup,
        url: str,
        keywords: List[str],
        state_name: str
    ) -> List[PolicyIndicator]:
        """Extract policy indicators from page content"""
        indicators = []

        # Get all text content
        text_content = soup.get_text().lower()

        # Check for different types of policy indicators
        indicator_patterns = {
            "AI_CURRICULUM": [
                r"ai curriculum",
                r"artificial intelligence.*curriculum",
                r"ai.*course",
                r"ai education.*standards"
            ],
            "AI_GUIDELINES": [
                r"ai guidelines",
                r"artificial intelligence.*policy",
                r"ai.*guidance",
                r"ai use.*policy"
            ],
            "TEACHER_TRAINING": [
                r"teacher.*ai.*training",
                r"professional development.*ai",
                r"educator.*artificial intelligence",
                r"ai.*professional learning"
            ],
            "AI_TOOLS": [
                r"ai tools.*education",
                r"chatgpt.*schools",
                r"ai.*educational technology",
                r"generative ai.*classroom"
            ],
            "ETHICS_POLICY": [
                r"ai ethics",
                r"responsible ai",
                r"ai.*privacy",
                r"ethical.*artificial intelligence"
            ],
            "PILOT_PROGRAMS": [
                r"ai pilot",
                r"ai.*initiative",
                r"artificial intelligence.*program",
                r"ai.*project"
            ]
        }

        for indicator_type, patterns in indicator_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text_content)
                for match in matches:
                    # Get surrounding context
                    start = max(0, match.start() - 100)
                    end = min(len(text_content), match.end() + 100)
                    evidence = text_content[start:end].strip()

                    # Calculate confidence based on context
                    confidence = self._calculate_confidence(evidence, keywords)

                    if confidence > 0.3:  # Threshold for inclusion
                        indicator = PolicyIndicator(
                            indicator_type=indicator_type,
                            description=f"{indicator_type} found for {state_name}",
                            source_url=url,
                            confidence_score=confidence,
                            evidence_text=evidence[:200]  # Limit evidence length
                        )
                        indicators.append(indicator)
                        # Only add one indicator per type per page
                        break

        return indicators

    def _calculate_confidence(self, text: str, keywords: List[str]) -> float:
        """Calculate confidence score based on keyword presence and context"""
        confidence = 0.5  # Base confidence

        # Check for official policy language
        if any(word in text for word in ["policy", "regulation", "mandate", "requirement"]):
            confidence += 0.2

        # Check for education-specific context
        if any(word in text for word in ["student", "teacher", "school", "classroom"]):
            confidence += 0.1

        # Check for multiple keywords
        keyword_count = sum(1 for kw in keywords if kw.lower() in text)
        confidence += min(keyword_count * 0.05, 0.2)

        return min(confidence, 1.0)

    def _extract_relevant_links(
        self,
        soup: BeautifulSoup,
        base_url: str,
        keywords: List[str]
    ) -> List[str]:
        """Extract links that might contain policy information"""
        relevant_links = []

        # Keywords that suggest policy pages
        policy_indicators = [
            'policy', 'policies', 'guidelines', 'standards', 'curriculum',
            'technology', 'digital', 'ai', 'artificial-intelligence',
            'innovation', 'strategic-plan'
        ]

        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text().lower()

            # Convert relative URLs to absolute
            full_url = urljoin(base_url, href)

            # Check if link is within same domain
            if not self._is_same_domain(full_url, base_url):
                continue

            # Check if URL or link text suggests policy content
            url_lower = full_url.lower()
            if any(indicator in url_lower or indicator in link_text
                   for indicator in policy_indicators):
                relevant_links.append(full_url)

        return relevant_links

    def _is_same_domain(self, url1: str, url2: str) -> bool:
        """Check if two URLs are from the same domain"""
        domain1 = urlparse(url1).netloc
        domain2 = urlparse(url2).netloc
        return domain1 == domain2
