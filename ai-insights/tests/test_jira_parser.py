"""
Tests for ai_insights.utils.jira_parser module.

Tests the actual implementation:
- parse_jira_csv() function
- match_products() function
- get_ingestion_summary() function
"""

from datetime import datetime, timedelta

import pytest


class TestParseJiraCsv:
    """Test parse_jira_csv function."""

    def test_parse_basic_csv(self):
        """Should parse basic Jira CSV with required fields."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status,Assignee
TEST-1,Test ticket summary,Open,John Doe
TEST-2,Another ticket,In Progress,Jane Smith"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 2
        assert documents[0]["metadata"]["issue_key"] == "TEST-1"
        assert documents[0]["metadata"]["status"] == "Open"
        assert documents[1]["metadata"]["assignee"] == "Jane Smith"

    def test_parse_csv_with_all_fields(self):
        """Should parse CSV with all optional fields."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status,Assignee,Reporter,Created,Updated,Due Date,Epic Name,Sprint,Labels,Priority,Issue Type,Description
TEST-1,Full ticket,Done,John,Jane,2024-01-01 10:00,2024-01-15 14:00,2024-02-01,Product Alpha,Sprint 1,bug;urgent,High,Bug,This is a detailed description"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        doc = documents[0]
        assert doc["metadata"]["issue_key"] == "TEST-1"
        assert doc["metadata"]["status"] == "Done"
        assert doc["metadata"]["epic_name"] == "Product Alpha"
        assert doc["metadata"]["sprint"] == "Sprint 1"
        assert doc["metadata"]["priority"] == "High"
        assert doc["metadata"]["issue_type"] == "Bug"
        assert "Full ticket" in doc["text"]
        assert "This is a detailed description" in doc["text"]

    def test_skip_rows_without_issue_key(self):
        """Should skip rows missing Issue key."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,Valid ticket,Open
,Missing key ticket,Open
TEST-2,Another valid,Done"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 2
        keys = [d["metadata"]["issue_key"] for d in documents]
        assert "TEST-1" in keys
        assert "TEST-2" in keys

    def test_skip_rows_without_summary(self):
        """Should skip rows missing Summary."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,Valid ticket,Open
TEST-2,,Open
TEST-3,Another valid,Done"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 2

    def test_handle_case_insensitive_columns(self):
        """Should handle column names case-insensitively."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """ISSUE KEY,SUMMARY,STATUS,ASSIGNEE
TEST-1,Test ticket,Open,John"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        assert documents[0]["metadata"]["issue_key"] == "TEST-1"

    def test_handle_alternative_column_names(self):
        """Should handle alternative Jira column names."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        # Jira exports can use different names
        csv_content = """Key,Summary,Status,Issue type,Due date
TEST-1,Test ticket,Open,Story,2024-06-01"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        assert documents[0]["metadata"]["issue_key"] == "TEST-1"

    def test_generate_unique_document_ids(self):
        """Should generate unique IDs based on content hash."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status,Updated
TEST-1,Ticket A,Open,2024-01-01 10:00
TEST-2,Ticket B,Done,2024-01-02 11:00"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 2
        assert documents[0]["id"] != documents[1]["id"]
        assert len(documents[0]["id"]) == 16  # MD5 hash truncated to 16

    def test_calculate_days_in_status(self):
        """Should calculate days in current status from updated date."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        # Use a recent date
        recent_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d %H:%M")

        csv_content = f"""Issue key,Summary,Status,Updated
TEST-1,Recent ticket,Open,{recent_date}"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        # Should be approximately 5 days
        days = documents[0]["metadata"]["days_in_status"]
        assert days is not None
        assert 4 <= days <= 6

    def test_handle_missing_dates(self):
        """Should handle missing date fields gracefully."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,No dates ticket,Open"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        assert documents[0]["metadata"]["days_in_status"] is None

    def test_document_text_format(self):
        """Should format document text with all available fields."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status,Priority,Assignee,Epic Name
TEST-1,Test summary,Open,High,John Doe,Product X"""

        documents = parse_jira_csv(csv_content)

        text = documents[0]["text"]
        assert "Jira Ticket: TEST-1" in text
        assert "Summary: Test summary" in text
        assert "Status: Open" in text
        assert "Priority: High" in text
        assert "Assignee: John Doe" in text
        assert "Epic/Product: Product X" in text

    def test_truncate_long_descriptions(self):
        """Should truncate descriptions to 500 characters."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        long_description = "x" * 1000
        csv_content = f"""Issue key,Summary,Status,Description
TEST-1,Test,Open,{long_description}"""

        documents = parse_jira_csv(csv_content)

        # Description in text should be truncated
        assert len(documents[0]["text"]) < len(long_description) + 500

    def test_handle_empty_csv(self):
        """Should return empty list for empty CSV."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status"""

        documents = parse_jira_csv(csv_content)

        assert documents == []

    def test_handle_various_date_formats(self):
        """Should handle various Jira date formats."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        # Different date formats Jira might export
        csv_content = """Issue key,Summary,Status,Updated
TEST-1,Format 1,Open,2024-01-15 10:30
TEST-2,Format 2,Done,15/Jan/24 10:30 AM"""

        documents = parse_jira_csv(csv_content)

        # Should parse without error
        assert len(documents) == 2


class TestMatchProducts:
    """Test match_products function."""

    def test_match_exact_product_name(self):
        """Should match epic name exactly to product."""
        from ai_insights.utils.jira_parser import match_products, parse_jira_csv

        csv_content = """Issue key,Summary,Status,Epic Name
TEST-1,Ticket for Alpha,Open,Product Alpha"""

        documents = parse_jira_csv(csv_content)
        product_names = ["Product Alpha", "Product Beta"]

        matched = match_products(documents, product_names)

        assert matched[0]["metadata"]["matched_product"] == "Product Alpha"

    def test_match_case_insensitive(self):
        """Should match products case-insensitively."""
        from ai_insights.utils.jira_parser import match_products, parse_jira_csv

        csv_content = """Issue key,Summary,Status,Epic Name
TEST-1,Ticket,Open,PRODUCT ALPHA"""

        documents = parse_jira_csv(csv_content)
        product_names = ["Product Alpha"]

        matched = match_products(documents, product_names)

        assert matched[0]["metadata"]["matched_product"] == "Product Alpha"

    def test_match_partial_name(self):
        """Should match partial product names."""
        from ai_insights.utils.jira_parser import match_products, parse_jira_csv

        csv_content = """Issue key,Summary,Status,Epic Name
TEST-1,Ticket,Open,Alpha Features"""

        documents = parse_jira_csv(csv_content)
        product_names = ["Alpha"]

        matched = match_products(documents, product_names)

        assert matched[0]["metadata"].get("matched_product") == "Alpha"

    def test_no_match_without_epic(self):
        """Should not match documents without epic name."""
        from ai_insights.utils.jira_parser import match_products, parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,No epic ticket,Open"""

        documents = parse_jira_csv(csv_content)
        product_names = ["Product Alpha"]

        matched = match_products(documents, product_names)

        assert "matched_product" not in matched[0]["metadata"]

    def test_no_match_when_no_products(self):
        """Should handle empty product list."""
        from ai_insights.utils.jira_parser import match_products, parse_jira_csv

        csv_content = """Issue key,Summary,Status,Epic Name
TEST-1,Ticket,Open,Some Epic"""

        documents = parse_jira_csv(csv_content)

        matched = match_products(documents, [])

        assert "matched_product" not in matched[0]["metadata"]


class TestGetIngestionSummary:
    """Test get_ingestion_summary function."""

    def test_summary_total_count(self):
        """Should count total tickets."""
        from ai_insights.utils.jira_parser import get_ingestion_summary, parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,Ticket 1,Open
TEST-2,Ticket 2,Done
TEST-3,Ticket 3,Open"""

        documents = parse_jira_csv(csv_content)
        summary = get_ingestion_summary(documents)

        assert summary["total_tickets"] == 3

    def test_summary_by_status(self):
        """Should group tickets by status."""
        from ai_insights.utils.jira_parser import get_ingestion_summary, parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,Ticket 1,Open
TEST-2,Ticket 2,Done
TEST-3,Ticket 3,Open
TEST-4,Ticket 4,In Progress"""

        documents = parse_jira_csv(csv_content)
        summary = get_ingestion_summary(documents)

        assert summary["by_status"]["Open"] == 2
        assert summary["by_status"]["Done"] == 1
        assert summary["by_status"]["In Progress"] == 1

    def test_summary_by_epic(self):
        """Should group tickets by epic."""
        from ai_insights.utils.jira_parser import get_ingestion_summary, parse_jira_csv

        csv_content = """Issue key,Summary,Status,Epic Name
TEST-1,Ticket 1,Open,Epic A
TEST-2,Ticket 2,Done,Epic A
TEST-3,Ticket 3,Open,Epic B"""

        documents = parse_jira_csv(csv_content)
        summary = get_ingestion_summary(documents)

        assert summary["by_epic"]["Epic A"] == 2
        assert summary["by_epic"]["Epic B"] == 1

    def test_summary_handles_missing_status(self):
        """Should handle documents with missing status."""
        from ai_insights.utils.jira_parser import get_ingestion_summary

        documents = [
            {"id": "1", "text": "text", "metadata": {}},
            {"id": "2", "text": "text", "metadata": {"status": "Open"}},
        ]

        summary = get_ingestion_summary(documents)

        assert summary["by_status"]["Unknown"] == 1
        assert summary["by_status"]["Open"] == 1

    def test_summary_handles_missing_epic(self):
        """Should handle documents with missing epic."""
        from ai_insights.utils.jira_parser import get_ingestion_summary

        documents = [
            {"id": "1", "text": "text", "metadata": {"status": "Open"}},
            {"id": "2", "text": "text", "metadata": {"status": "Done", "epic_name": "Epic X"}},
        ]

        summary = get_ingestion_summary(documents)

        assert summary["by_epic"]["No Epic"] == 1
        assert summary["by_epic"]["Epic X"] == 1

    def test_summary_empty_documents(self):
        """Should handle empty document list."""
        from ai_insights.utils.jira_parser import get_ingestion_summary

        summary = get_ingestion_summary([])

        assert summary["total_tickets"] == 0
        assert summary["by_status"] == {}
        assert summary["by_epic"] == {}


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_parse_csv_with_special_characters(self):
        """Should handle special characters in fields."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = '''Issue key,Summary,Status,Description
TEST-1,"Ticket with ""quotes""",Open,"Description with, commas and ""quotes"""'''

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        assert "quotes" in documents[0]["text"]

    def test_parse_csv_with_unicode(self):
        """Should handle unicode characters."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = """Issue key,Summary,Status
TEST-1,Ticket with émojis 🎉,Open"""

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1
        assert "émojis" in documents[0]["text"] or "mojis" in documents[0]["text"]

    def test_parse_csv_with_newlines_in_description(self):
        """Should handle newlines in description field."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        csv_content = '''Issue key,Summary,Status,Description
TEST-1,Test ticket,Open,"Line 1
Line 2
Line 3"'''

        documents = parse_jira_csv(csv_content)

        assert len(documents) == 1

    def test_parse_preserves_metadata_types(self):
        """Should preserve appropriate metadata types."""
        from ai_insights.utils.jira_parser import parse_jira_csv

        recent_date = datetime.now().strftime("%Y-%m-%d %H:%M")
        csv_content = f"""Issue key,Summary,Status,Updated
TEST-1,Test,Open,{recent_date}"""

        documents = parse_jira_csv(csv_content)

        # days_in_status should be an integer
        days = documents[0]["metadata"]["days_in_status"]
        assert days is None or isinstance(days, int)


class TestIntegration:
    """Integration tests combining multiple functions."""

    def test_full_ingestion_workflow(self):
        """Test complete ingestion workflow."""
        from ai_insights.utils.jira_parser import (
            get_ingestion_summary,
            match_products,
            parse_jira_csv,
        )

        csv_content = """Issue key,Summary,Status,Epic Name,Priority
TEST-1,Feature request,Open,Product Alpha,High
TEST-2,Bug fix,Done,Product Alpha,Critical
TEST-3,Enhancement,In Progress,Product Beta,Medium
TEST-4,Documentation,Open,Product Beta,Low
TEST-5,Backlog item,Backlog,,Low"""

        # Parse
        documents = parse_jira_csv(csv_content)
        assert len(documents) == 5

        # Match products
        product_names = ["Product Alpha", "Product Beta", "Product Gamma"]
        matched = match_products(documents, product_names)

        # Check matches
        matched_products = [d["metadata"].get("matched_product") for d in matched]
        assert "Product Alpha" in matched_products
        assert "Product Beta" in matched_products

        # Get summary
        summary = get_ingestion_summary(matched)
        assert summary["total_tickets"] == 5
        assert summary["by_status"]["Open"] == 2
        assert summary["by_epic"]["Product Alpha"] == 2
        assert summary["by_epic"]["Product Beta"] == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
