"""
Gemini function calling tool definitions.
Each function here is a tool the AI agent can autonomously call.
"""

AGENT_TOOLS = [
    {
        "name": "parse_tasks",
        "description": (
            "Extract one or more tasks from natural language input. "
            "Use this when the user describes tasks, deadlines, or commitments in plain text. "
            "Returns a list of structured task objects."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "tasks": {
                    "type": "array",
                    "description": "List of tasks parsed from the user's message",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Short, clear task title"
                            },
                            "deadline": {
                                "type": "string",
                                "description": "Deadline as ISO 8601 string, e.g. 2026-06-27T23:59:00. Infer from context like 'Friday' or 'tomorrow'."
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "critical"],
                                "description": "Priority based on urgency and importance"
                            },
                            "estimated_minutes": {
                                "type": "integer",
                                "description": "Estimated time to complete in minutes"
                            },
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Category tags like 'study', 'work', 'personal'"
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            "required": ["tasks"]
        }
    },
    {
        "name": "detect_conflicts",
        "description": (
            "Scan the user's current task list and identify scheduling conflicts, "
            "overloaded days, impossible deadlines, or tasks with insufficient time allocated. "
            "Always call this proactively at the start of each session."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "conflicts": {
                    "type": "array",
                    "description": "List of detected conflicts",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["overload", "deadline_clash", "no_time", "missing_deadline"],
                                "description": "Type of conflict"
                            },
                            "severity": {
                                "type": "string",
                                "enum": ["warning", "critical"],
                                "description": "How urgent this conflict is"
                            },
                            "message": {
                                "type": "string",
                                "description": "Human-readable description of the conflict"
                            },
                            "affected_task_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "IDs of tasks involved in the conflict"
                            }
                        },
                        "required": ["type", "severity", "message"]
                    }
                }
            },
            "required": ["conflicts"]
        }
    },
    {
        "name": "generate_subtasks",
        "description": (
            "Break a large or vague task into specific, actionable subtasks with time estimates. "
            "Use this when a task title is broad (e.g. 'Build project', 'Study for exam')."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "ID of the parent task to break down"
                },
                "subtasks": {
                    "type": "array",
                    "description": "Generated subtasks",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Specific, actionable subtask title"
                            },
                            "estimated_minutes": {
                                "type": "integer",
                                "description": "Estimated time for this subtask in minutes"
                            }
                        },
                        "required": ["title", "estimated_minutes"]
                    }
                }
            },
            "required": ["task_id", "subtasks"]
        }
    },
    {
        "name": "reschedule",
        "description": (
            "Automatically reorganise and reprioritise tasks based on deadlines and available time. "
            "Call this when the user marks a task late, adds a new urgent task, or requests replanning. "
            "Returns updated priority and deadline suggestions for affected tasks."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "updates": {
                    "type": "array",
                    "description": "Rescheduling changes for affected tasks",
                    "items": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "string",
                                "description": "ID of task to update"
                            },
                            "new_priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "critical"]
                            },
                            "suggested_start": {
                                "type": "string",
                                "description": "Suggested start time as ISO 8601 string"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Why this task was rescheduled"
                            }
                        },
                        "required": ["task_id", "reason"]
                    }
                },
                "summary": {
                    "type": "string",
                    "description": "Brief summary of all rescheduling changes made"
                }
            },
            "required": ["updates", "summary"]
        }
    },
    {
        "name": "flag_procrastination",
        "description": (
            "Identify tasks that have been repeatedly rescheduled or ignored. "
            "Call this proactively at session start. Returns flagged tasks with intervention suggestions."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flags": {
                    "type": "array",
                    "description": "Procrastination flags",
                    "items": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "string",
                                "description": "ID of the procrastinated task"
                            },
                            "task_title": {
                                "type": "string"
                            },
                            "reschedule_count": {
                                "type": "integer",
                                "description": "How many times this task has been pushed"
                            },
                            "suggestion": {
                                "type": "string",
                                "description": "Specific intervention suggestion for this task"
                            }
                        },
                        "required": ["task_id", "task_title", "reschedule_count", "suggestion"]
                    }
                }
            },
            "required": ["flags"]
        }
    },
    {
        "name": "generate_debrief",
        "description": (
            "Generate an end-of-day summary: tasks completed, tasks at risk tomorrow, "
            "productivity insights, and a suggested plan for the next day."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "completed_summary": {
                    "type": "string",
                    "description": "Summary of what was accomplished today"
                },
                "at_risk_tomorrow": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Task IDs that are at risk for tomorrow"
                },
                "productivity_insight": {
                    "type": "string",
                    "description": "One actionable insight about the user's productivity patterns"
                },
                "tomorrow_plan": {
                    "type": "string",
                    "description": "Suggested priority order and focus areas for tomorrow"
                }
            },
            "required": ["completed_summary", "productivity_insight", "tomorrow_plan"]
        }
    },
    {
        "name": "draft_email",
        "description": (
            "Draft an email on behalf of the user. Use this when the user is going to miss a deadline, "
            "needs an extension, or asks you to email someone (e.g. a professor, manager, or teammate). "
            "This will create an actionable 'Send Email' button in the UI."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "recipient": {
                    "type": "string",
                    "description": "The name or title of the person receiving the email (e.g. 'Professor Smith')"
                },
                "email_address": {
                    "type": "string",
                    "description": "The recipient's email address if known, otherwise leave blank or guess a placeholder"
                },
                "subject": {
                    "type": "string",
                    "description": "A professional and clear subject line"
                },
                "body": {
                    "type": "string",
                    "description": "The full text of the email. Keep it professional, concise, and persuasive."
                }
            },
            "required": ["recipient", "subject", "body"]
        }
    }
]
