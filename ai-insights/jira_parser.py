"""Jira CSV Parser - Converts Jira export to RAG-friendly documents"""
import csv
import hashlib
from typing import List, Dict, Any, Optional
from io import StringIO
from datetime import datetime


def parse_jira_csv(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse Jira CSV export and convert to document chunks for RAG ingestion.
    
    Expected columns (flexible - handles missing columns):
    - Issue key, Summary, Status, Assignee, Reporter
    - Created, Updated, Due Date, Resolved
    - Epic Link, Epic Name, Sprint, Labels
    - Priority, Issue Type, Description
    """
    documents = []
    reader = csv.DictReader(StringIO(csv_content))
    
    # Normalize column names (Jira exports vary)
    def get_field(row: Dict, *possible_names: str) -> Optional[str]:
        for name in possible_names:
            # Try exact match
            if name in row:
                return row[name]
            # Try case-insensitive
            for key in row.keys():
                if key.lower() == name.lower():
                    return row[key]
        return None
    
    for row in reader:
        # Extract fields with fallbacks
        issue_key = get_field(row, "Issue key", "Key", "issue_key")
        summary = get_field(row, "Summary", "summary")
        status = get_field(row, "Status", "status")
        assignee = get_field(row, "Assignee", "assignee")
        reporter = get_field(row, "Reporter", "reporter")
        created = get_field(row, "Created", "created")
        updated = get_field(row, "Updated", "updated")
        due_date = get_field(row, "Due Date", "Due date", "duedate")
        resolved = get_field(row, "Resolved", "resolved", "Resolution Date")
        epic_name = get_field(row, "Epic Name", "Epic Link", "epic_name", "Parent")
        sprint = get_field(row, "Sprint", "sprint")
        labels = get_field(row, "Labels", "labels")
        priority = get_field(row, "Priority", "priority")
        issue_type = get_field(row, "Issue Type", "Issue type", "issuetype")
        description = get_field(row, "Description", "description")
        
        if not issue_key or not summary:
            continue  # Skip invalid rows
        
        # Calculate days in current status
        days_in_status = None
        if updated:
            try:
                # Handle various date formats
                for fmt in ["%Y-%m-%d %H:%M", "%d/%b/%y %I:%M %p", "%Y-%m-%dT%H:%M:%S"]:
                    try:
                        updated_dt = datetime.strptime(updated.split(".")[0], fmt)
                        days_in_status = (datetime.now() - updated_dt).days
                        break
                    except ValueError:
                        continue
            except Exception:
                pass
        
        # Build document text for RAG
        doc_text = f"""Jira Ticket: {issue_key}
Summary: {summary}
Status: {status or 'Unknown'}
Type: {issue_type or 'Task'}
Priority: {priority or 'Medium'}
Assignee: {assignee or 'Unassigned'}
Reporter: {reporter or 'Unknown'}
Epic/Product: {epic_name or 'No Epic'}
Sprint: {sprint or 'Backlog'}
Labels: {labels or 'None'}
Created: {created or 'Unknown'}
Last Updated: {updated or 'Unknown'}
Due Date: {due_date or 'Not set'}
Resolved: {resolved or 'Not resolved'}
Days in current status: {days_in_status if days_in_status is not None else 'Unknown'}
Description: {(description or 'No description')[:500]}"""
        
        # Generate unique ID based on content hash
        doc_id = hashlib.md5(f"{issue_key}_{updated or created}".encode()).hexdigest()[:16]
        
        documents.append({
            "id": doc_id,
            "text": doc_text,
            "metadata": {
                "source": "jira",
                "issue_key": issue_key,
                "status": status,
                "epic_name": epic_name,
                "sprint": sprint,
                "assignee": assignee,
                "priority": priority,
                "issue_type": issue_type,
                "days_in_status": days_in_status,
            }
        })
    
    return documents


def match_products(documents: List[Dict], product_names: List[str]) -> List[Dict]:
    """
    Attempt to match Jira tickets to products based on Epic name or labels.
    """
    # Build lowercase lookup
    product_lookup = {name.lower(): name for name in product_names}
    
    for doc in documents:
        epic_name = doc["metadata"].get("epic_name", "")
        if epic_name:
            # Try exact match first
            if epic_name.lower() in product_lookup:
                doc["metadata"]["matched_product"] = product_lookup[epic_name.lower()]
            else:
                # Try partial match
                for key, name in product_lookup.items():
                    if key in epic_name.lower() or epic_name.lower() in key:
                        doc["metadata"]["matched_product"] = name
                        break
    
    return documents


def get_ingestion_summary(documents: List[Dict]) -> Dict[str, Any]:
    """Generate summary of what was parsed."""
    statuses = {}
    epics = {}
    
    for doc in documents:
        status = doc["metadata"].get("status", "Unknown")
        epic = doc["metadata"].get("epic_name", "No Epic")
        
        statuses[status] = statuses.get(status, 0) + 1
        epics[epic] = epics.get(epic, 0) + 1
    
    return {
        "total_tickets": len(documents),
        "by_status": statuses,
        "by_epic": epics,
    }
