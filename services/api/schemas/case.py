from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

Severity = Literal["low", "medium", "high", "critical"]
Status = Literal["open", "investigating", "contained", "escalated", "closed"]
Source = Literal["manual", "windows_logs", "suricata", "zeek", "splunk_export", "elastic_export", "yara"]


class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Severity = "medium"
    status: Status = "open"
    source: Source = "manual"
    affected_host: Optional[str] = None
    affected_user: Optional[str] = None
    affected_ip: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    status: Optional[Status] = None
    source: Optional[Source] = None
    affected_host: Optional[str] = None
    affected_user: Optional[str] = None
    affected_ip: Optional[str] = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    severity: str
    status: str
    source: str
    affected_host: Optional[str]
    affected_user: Optional[str]
    affected_ip: Optional[str]
    created_at: datetime
    updated_at: datetime
