"""
Report generation and visualization for AI education policy data
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List
import json
from datetime import datetime
import os

from .models import StatePolicy, NationalSummary, PolicyAdoptionLevel

# Set up plotting style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)


class PolicyReporter:
    """Generates reports and visualizations for policy data"""

    def __init__(self, output_dir: str = "output"):
        """Initialize reporter with output directory"""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/charts", exist_ok=True)
        os.makedirs(f"{output_dir}/data", exist_ok=True)

    def generate_full_report(
        self,
        state_policies: Dict[str, StatePolicy],
        summary: NationalSummary,
        regional_stats: Dict[str, Dict]
    ):
        """Generate complete report with all visualizations and data exports"""

        # Export data
        self.export_to_csv(state_policies)
        self.export_to_json(state_policies, summary, regional_stats)

        # Generate visualizations
        self.plot_state_rankings(state_policies)
        self.plot_adoption_distribution(summary)
        self.plot_regional_comparison(regional_stats)
        self.plot_indicator_heatmap(state_policies)

        # Generate text report
        self.generate_text_report(state_policies, summary, regional_stats)

        print(f"\nReports generated in '{self.output_dir}' directory")

    def export_to_csv(self, state_policies: Dict[str, StatePolicy]):
        """Export policy data to CSV"""
        data = []

        for state_name, policy in state_policies.items():
            row = {
                'State': policy.state_name,
                'Abbreviation': policy.state_abbr,
                'Adoption Score': policy.adoption_score,
                'Adoption Level': policy.adoption_level.name,
                'Number of Indicators': len(policy.indicators),
                'Last Updated': policy.last_updated.strftime('%Y-%m-%d')
            }

            # Count indicators by type
            indicator_types = ['AI_CURRICULUM', 'AI_GUIDELINES', 'TEACHER_TRAINING',
                             'AI_TOOLS', 'ETHICS_POLICY', 'PILOT_PROGRAMS']
            for ind_type in indicator_types:
                count = sum(1 for ind in policy.indicators if ind.indicator_type == ind_type)
                row[ind_type] = count

            data.append(row)

        df = pd.DataFrame(data)
        df = df.sort_values('Adoption Score', ascending=False)
        output_path = f"{self.output_dir}/data/state_policies.csv"
        df.to_csv(output_path, index=False)
        print(f"CSV export saved to: {output_path}")

    def export_to_json(
        self,
        state_policies: Dict[str, StatePolicy],
        summary: NationalSummary,
        regional_stats: Dict[str, Dict]
    ):
        """Export detailed data to JSON"""
        data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_states': summary.total_states,
                'states_with_policies': summary.states_with_policies
            },
            'national_summary': {
                'average_adoption_score': summary.average_adoption_score,
                'adoption_distribution': {
                    level.name: count
                    for level, count in summary.adoption_distribution.items()
                },
                'leading_states': summary.leading_states
            },
            'regional_statistics': regional_stats,
            'state_details': {}
        }

        for state_name, policy in state_policies.items():
            data['state_details'][state_name] = {
                'state_name': policy.state_name,
                'state_abbr': policy.state_abbr,
                'adoption_score': policy.adoption_score,
                'adoption_level': policy.adoption_level.name,
                'indicators': [
                    {
                        'type': ind.indicator_type,
                        'description': ind.description,
                        'source_url': ind.source_url,
                        'confidence_score': ind.confidence_score,
                        'evidence': ind.evidence_text
                    }
                    for ind in policy.indicators
                ]
            }

        output_path = f"{self.output_dir}/data/full_report.json"
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"JSON export saved to: {output_path}")

    def plot_state_rankings(self, state_policies: Dict[str, StatePolicy]):
        """Create bar chart of state rankings"""
        # Prepare data
        states = []
        scores = []
        colors = []

        color_map = {
            PolicyAdoptionLevel.LEADING: '#2ecc71',
            PolicyAdoptionLevel.ESTABLISHED: '#3498db',
            PolicyAdoptionLevel.DEVELOPING: '#f39c12',
            PolicyAdoptionLevel.EMERGING: '#e74c3c',
            PolicyAdoptionLevel.NONE: '#95a5a6'
        }

        sorted_policies = sorted(
            state_policies.values(),
            key=lambda p: p.adoption_score,
            reverse=True
        )

        # Show top 20 states
        for policy in sorted_policies[:20]:
            states.append(policy.state_abbr)
            scores.append(policy.adoption_score)
            colors.append(color_map[policy.adoption_level])

        # Create plot
        fig, ax = plt.subplots(figsize=(14, 8))
        bars = ax.barh(states, scores, color=colors)

        ax.set_xlabel('Adoption Score', fontsize=12)
        ax.set_ylabel('State', fontsize=12)
        ax.set_title('Top 20 States - AI Education Policy Adoption', fontsize=14, fontweight='bold')
        ax.set_xlim(0, 1.0)

        # Add value labels
        for i, (score, bar) in enumerate(zip(scores, bars)):
            ax.text(score + 0.02, i, f'{score:.2f}', va='center', fontsize=9)

        # Add legend
        legend_elements = [
            plt.Rectangle((0, 0), 1, 1, fc=color_map[level], label=level.name)
            for level in PolicyAdoptionLevel
        ]
        ax.legend(handles=legend_elements, loc='lower right')

        plt.tight_layout()
        output_path = f"{self.output_dir}/charts/state_rankings.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"State rankings chart saved to: {output_path}")

    def plot_adoption_distribution(self, summary: NationalSummary):
        """Create pie chart of adoption level distribution"""
        labels = []
        sizes = []
        colors = ['#2ecc71', '#3498db', '#f39c12', '#e74c3c', '#95a5a6']

        for level in PolicyAdoptionLevel:
            count = summary.adoption_distribution[level]
            if count > 0:
                labels.append(f"{level.name}\n({count} states)")
                sizes.append(count)

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.pie(sizes, labels=labels, colors=colors[:len(labels)], autopct='%1.1f%%',
               startangle=90, textprops={'fontsize': 11})
        ax.set_title('Distribution of AI Education Policy Adoption Levels',
                    fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()
        output_path = f"{self.output_dir}/charts/adoption_distribution.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Adoption distribution chart saved to: {output_path}")

    def plot_regional_comparison(self, regional_stats: Dict[str, Dict]):
        """Create bar chart comparing regions"""
        regions = list(regional_stats.keys())
        avg_scores = [stats['average_score'] for stats in regional_stats.values()]
        adoption_rates = [stats['adoption_rate'] for stats in regional_stats.values()]

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

        # Average scores
        ax1.bar(regions, avg_scores, color='#3498db')
        ax1.set_ylabel('Average Adoption Score', fontsize=12)
        ax1.set_title('Average AI Ed Policy Score by Region', fontsize=13, fontweight='bold')
        ax1.set_ylim(0, 1.0)
        for i, score in enumerate(avg_scores):
            ax1.text(i, score + 0.02, f'{score:.2f}', ha='center', fontsize=10)

        # Adoption rates
        ax2.bar(regions, [r * 100 for r in adoption_rates], color='#2ecc71')
        ax2.set_ylabel('Adoption Rate (%)', fontsize=12)
        ax2.set_title('Policy Adoption Rate by Region', fontsize=13, fontweight='bold')
        ax2.set_ylim(0, 100)
        for i, rate in enumerate(adoption_rates):
            ax2.text(i, rate * 100 + 2, f'{rate*100:.1f}%', ha='center', fontsize=10)

        plt.tight_layout()
        output_path = f"{self.output_dir}/charts/regional_comparison.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Regional comparison chart saved to: {output_path}")

    def plot_indicator_heatmap(self, state_policies: Dict[str, StatePolicy]):
        """Create heatmap showing which states have which policy indicators"""
        indicator_types = ['AI_CURRICULUM', 'AI_GUIDELINES', 'TEACHER_TRAINING',
                          'AI_TOOLS', 'ETHICS_POLICY', 'PILOT_PROGRAMS']

        # Prepare data - only show top 25 states by score
        sorted_policies = sorted(
            state_policies.values(),
            key=lambda p: p.adoption_score,
            reverse=True
        )[:25]

        data = []
        state_names = []

        for policy in sorted_policies:
            row = []
            for ind_type in indicator_types:
                count = sum(1 for ind in policy.indicators if ind.indicator_type == ind_type)
                row.append(1 if count > 0 else 0)
            data.append(row)
            state_names.append(policy.state_abbr)

        # Create heatmap
        fig, ax = plt.subplots(figsize=(12, 14))
        sns.heatmap(data, xticklabels=indicator_types, yticklabels=state_names,
                   cmap='RdYlGn', cbar_kws={'label': 'Present'}, ax=ax,
                   linewidths=0.5, linecolor='gray')

        ax.set_title('AI Education Policy Indicators by State (Top 25)',
                    fontsize=14, fontweight='bold', pad=20)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)

        plt.tight_layout()
        output_path = f"{self.output_dir}/charts/indicator_heatmap.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Indicator heatmap saved to: {output_path}")

    def generate_text_report(
        self,
        state_policies: Dict[str, StatePolicy],
        summary: NationalSummary,
        regional_stats: Dict[str, Dict]
    ):
        """Generate comprehensive text report"""
        report_lines = []

        report_lines.append("=" * 80)
        report_lines.append("AI EDUCATION POLICY ADOPTION REPORT")
        report_lines.append("United States - State Analysis")
        report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 80)
        report_lines.append("")

        # National Summary
        report_lines.append("NATIONAL SUMMARY")
        report_lines.append("-" * 80)
        report_lines.append(f"Total States Analyzed: {summary.total_states}")
        report_lines.append(f"States with AI Ed Policies: {summary.states_with_policies}")
        report_lines.append(f"Average Adoption Score: {summary.average_adoption_score:.3f}")
        report_lines.append("")

        report_lines.append("Adoption Level Distribution:")
        for level, count in summary.adoption_distribution.items():
            percentage = (count / summary.total_states) * 100
            report_lines.append(f"  {level.name:15s}: {count:2d} states ({percentage:5.1f}%)")
        report_lines.append("")

        # Leading States
        report_lines.append("Top 10 Leading States:")
        sorted_policies = sorted(
            state_policies.values(),
            key=lambda p: p.adoption_score,
            reverse=True
        )[:10]
        for i, policy in enumerate(sorted_policies, 1):
            report_lines.append(
                f"  {i:2d}. {policy.state_name:20s} - "
                f"Score: {policy.adoption_score:.3f} ({policy.adoption_level.name})"
            )
        report_lines.append("")

        # Regional Analysis
        report_lines.append("REGIONAL ANALYSIS")
        report_lines.append("-" * 80)
        for region, stats in sorted(regional_stats.items()):
            report_lines.append(f"{region}:")
            report_lines.append(f"  Average Score: {stats['average_score']:.3f}")
            report_lines.append(
                f"  Adoption Rate: {stats['adoption_rate']*100:.1f}% "
                f"({stats['states_with_policies']}/{stats['total_states']} states)"
            )
            report_lines.append("")

        # Detailed State Information
        report_lines.append("DETAILED STATE BREAKDOWN")
        report_lines.append("-" * 80)
        for policy in sorted_policies[:50]:  # Top 50 states
            report_lines.append(f"\n{policy.state_name} ({policy.state_abbr})")
            report_lines.append(f"  Adoption Score: {policy.adoption_score:.3f}")
            report_lines.append(f"  Adoption Level: {policy.adoption_level.name}")
            report_lines.append(f"  Indicators Found: {len(policy.indicators)}")

            if policy.indicators:
                indicator_summary = {}
                for ind in policy.indicators:
                    indicator_summary[ind.indicator_type] = indicator_summary.get(ind.indicator_type, 0) + 1

                report_lines.append("  Policy Components:")
                for ind_type, count in indicator_summary.items():
                    report_lines.append(f"    - {ind_type}: {count}")

        # Save report
        output_path = f"{self.output_dir}/report.txt"
        with open(output_path, 'w') as f:
            f.write('\n'.join(report_lines))

        print(f"\nText report saved to: {output_path}")

        # Also print summary to console
        print("\n" + "\n".join(report_lines[:30]))
