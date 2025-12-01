"""
Result validation and quality assurance for AI agent outputs.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of validation check."""
    is_valid: bool
    score: float  # 0.0 to 1.0
    issues: List[str]
    suggestions: List[str]

class ResultValidator:
    """Validates and scores AI-generated results for quality and accuracy."""

    def __init__(self):
        self.min_content_length = 50
        self.max_content_length = 10000

    def validate_analysis_result(self, content: str, query: str) -> ValidationResult:
        """
        Validate analysis result content.

        Args:
            content: The analysis result text
            query: The original user query

        Returns:
            ValidationResult with quality assessment
        """
        issues = []
        suggestions = []
        score = 1.0

        # Basic content checks
        if not content or not content.strip():
            return ValidationResult(False, 0.0, ["Content is empty"], ["Ensure the analysis generates meaningful output"])

        content = content.strip()

        # Length validation
        if len(content) < self.min_content_length:
            issues.append(f"Content too short ({len(content)} chars, minimum {self.min_content_length})")
            score -= 0.3
            suggestions.append("Expand the analysis with more detailed explanations")

        if len(content) > self.max_content_length:
            issues.append(f"Content too long ({len(content)} chars, maximum {self.max_content_length})")
            score -= 0.1
            suggestions.append("Consider summarizing key points more concisely")

        # Structure validation
        structure_score = self._validate_structure(content)
        score *= structure_score
        if structure_score < 0.8:
            struct_issues, struct_suggestions = self._get_structure_feedback(content)
            issues.extend(struct_issues)
            suggestions.extend(struct_suggestions)

        # Content quality validation
        quality_score = self._validate_content_quality(content, query)
        score *= quality_score
        if quality_score < 0.8:
            qual_issues, qual_suggestions = self._get_quality_feedback(content, query)
            issues.extend(qual_issues)
            suggestions.extend(qual_suggestions)

        # Relevance validation (less strict)
        relevance_score = self._validate_relevance(content, query)
        # Reduce the impact of relevance on the overall score
        score = score * 0.8 + relevance_score * 0.2
        if relevance_score < 0.3:  # Much lower threshold
            issues.append("Content may not fully address the query")
            suggestions.append("Ensure analysis directly answers the user's specific question")

        # Ensure score is between 0 and 1
        score = max(0.0, min(1.0, score))

        is_valid = score >= 0.4  # Lower minimum acceptable score

        return ValidationResult(is_valid, score, issues, suggestions)

    def validate_visualization_code(self, code: str, df_columns: List[str]) -> ValidationResult:
        """
        Validate visualization code quality.

        Args:
            code: The generated Python code
            df_columns: Available dataframe columns

        Returns:
            ValidationResult with quality assessment
        """
        issues = []
        suggestions = []
        score = 1.0

        if not code or not code.strip():
            return ValidationResult(False, 0.0, ["Code is empty"], ["Generate valid Python code for visualization"])

        # Check for required elements
        if 'fig' not in code:
            issues.append("Code does not create a 'fig' object")
            score -= 0.5
            suggestions.append("Ensure the code creates a Plotly figure object named 'fig'")

        # Check for Plotly usage
        if not ('px.' in code or 'go.' in code):
            issues.append("Code does not use Plotly libraries")
            score -= 0.4
            suggestions.append("Use Plotly Express (px) or Graph Objects (go) for visualization")

        # Check for dataframe usage
        if 'df' not in code and 'pd.read_csv' not in code:
            issues.append("Code does not reference the dataframe")
            score -= 0.3
            suggestions.append("Use the provided dataframe 'df' in your visualization code")

        # Validate column references
        used_columns = self._extract_column_references(code)
        invalid_columns = [col for col in used_columns if col not in df_columns]
        if invalid_columns:
            issues.append(f"Code references non-existent columns: {invalid_columns}")
            score -= 0.2
            suggestions.append(f"Use only available columns: {df_columns}")

        # Check for basic syntax issues
        syntax_issues = self._check_basic_syntax(code)
        if syntax_issues:
            issues.extend(syntax_issues)
            score -= 0.1 * len(syntax_issues)
            suggestions.append("Fix syntax errors in the generated code")

        score = max(0.0, min(1.0, score))
        is_valid = score >= 0.5

        return ValidationResult(is_valid, score, issues, suggestions)

    def _validate_structure(self, content: str) -> float:
        """Validate content structure and organization."""
        score = 0.5  # Base score

        # Check for sections/headings
        if re.search(r'^#+\s', content, re.MULTILINE):
            score += 0.2

        # Check for bullet points or numbered lists
        if re.search(r'^[\s]*[-\*]\s', content, re.MULTILINE) or re.search(r'^\s*\d+\.\s', content, re.MULTILINE):
            score += 0.15

        # Check for paragraphs (multiple sentences)
        paragraphs = re.split(r'\n\s*\n', content)
        meaningful_paragraphs = [p for p in paragraphs if len(p.strip()) > 20]
        if len(meaningful_paragraphs) >= 2:
            score += 0.15

        return min(1.0, score)

    def _validate_content_quality(self, content: str, query: str) -> float:
        """Validate content quality and informativeness."""
        score = 0.5  # Base score

        # Check for specific numbers/metrics
        if re.search(r'\b\d+(\.\d+)?%?\b', content):
            score += 0.2

        # Check for data insights (comparisons, trends)
        insight_indicators = ['increase', 'decrease', 'trend', 'pattern', 'correlation', 'higher than', 'lower than']
        found_insights = sum(1 for indicator in insight_indicators if indicator.lower() in content.lower())
        score += min(0.2, found_insights * 0.05)

        # Check for actionable content
        if any(word in content.lower() for word in ['recommend', 'suggest', 'should', 'consider', 'action']):
            score += 0.1

        return min(1.0, score)

    def _validate_relevance(self, content: str, query: str) -> float:
        """Validate content relevance to the query."""
        query_lower = query.lower()
        content_lower = content.lower()

        # Key terms that indicate relevance for data analysis
        analysis_indicators = [
            'analysis', 'report', 'summary', 'findings', 'results', 'data',
            'correlation', 'relationship', 'comparison', 'statistics', 'insights'
        ]

        # Check if content contains analysis-related terms
        analysis_score = sum(1 for term in analysis_indicators if term in content_lower) / len(analysis_indicators)

        # Check for specific query terms in content
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        content_words = set(re.findall(r'\b\w+\b', content_lower))

        # Calculate word overlap
        overlap = len(query_words.intersection(content_words))
        total_query_words = len(query_words)

        overlap_score = overlap / max(total_query_words, 1)

        # Check for semantic relevance (related concepts)
        semantic_relevance = 0.0
        if any(word in content_lower for word in ['make', 'manufacturer', 'model', 'vehicle', 'car']):
            semantic_relevance += 0.3
        if any(word in content_lower for word in ['correlation', 'relationship', 'comparison']):
            semantic_relevance += 0.3
        if any(word in content_lower for word in ['percentage', 'average', 'total', 'count']):
            semantic_relevance += 0.2

        # Combine scores with weights
        relevance_score = (overlap_score * 0.4) + (analysis_score * 0.3) + (semantic_relevance * 0.3)

        # Boost score for direct question answering
        if '?' in query and any(word in content_lower for word in ['answer', 'result', 'finding', 'analysis', 'report']):
            relevance_score += 0.2

        return min(1.0, relevance_score)

    def _get_structure_feedback(self, content: str) -> Tuple[List[str], List[str]]:
        """Get feedback on content structure."""
        issues = []
        suggestions = []

        if not re.search(r'^#+\s', content, re.MULTILINE):
            issues.append("Content lacks clear section headers")
            suggestions.append("Use markdown headers (# ## ###) to organize content into sections")

        if not (re.search(r'^[\s]*[-\*]\s', content, re.MULTILINE) or re.search(r'^\s*\d+\.\s', content, re.MULTILINE)):
            issues.append("Content could benefit from lists")
            suggestions.append("Use bullet points or numbered lists for key findings and recommendations")

        return issues, suggestions

    def _get_quality_feedback(self, content: str, query: str) -> Tuple[List[str], List[str]]:
        """Get feedback on content quality."""
        issues = []
        suggestions = []

        if not re.search(r'\b\d+(\.\d+)?%?\b', content):
            issues.append("Analysis lacks specific numbers or metrics")
            suggestions.append("Include concrete numbers, percentages, and statistics to support findings")

        if not any(word in content.lower() for word in ['recommend', 'suggest', 'should', 'consider']):
            issues.append("Analysis lacks actionable recommendations")
            suggestions.append("Provide specific recommendations based on the analysis")

        return issues, suggestions

    def _extract_column_references(self, code: str) -> List[str]:
        """Extract column references from code."""
        # Look for patterns like df['column'] or df.column
        column_pattern = r"df\[['\"]([^'\"]+)['\"]\]|df\.(\w+)"
        matches = re.findall(column_pattern, code)
        columns = []
        for match in matches:
            columns.append(match[0] if match[0] else match[1])
        return list(set(columns))

    def _check_basic_syntax(self, code: str) -> List[str]:
        """Check for basic syntax issues in code."""
        issues = []

        # Check for unmatched quotes
        single_quotes = code.count("'") - code.count("\\'")
        double_quotes = code.count('"') - code.count('\\"')
        if single_quotes % 2 != 0:
            issues.append("Unmatched single quotes in code")
        if double_quotes % 2 != 0:
            issues.append("Unmatched double quotes in code")

        # Check for basic parentheses matching
        if code.count('(') != code.count(')'):
            issues.append("Unmatched parentheses in code")
        if code.count('[') != code.count(']'):
            issues.append("Unmatched square brackets in code")
        if code.count('{') != code.count('}'):
            issues.append("Unmatched curly braces in code")

        return issues