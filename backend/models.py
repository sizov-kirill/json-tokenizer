from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    json_str: str
    max_depth: int = 5
