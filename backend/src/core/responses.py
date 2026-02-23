from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None
    error: Optional[Any] = None

def success_response(data: Any = None, message: str = "Operation successful"):
    return {
        "success": True,
        "message": message,
        "data": data,
        "error": None
    }

def error_response(message: str, error_code: str = "INTERNAL_ERROR", status_code: int = 500, extra: Any = None):
    return {
        "success": False,
        "message": message,
        "data": None,
        "error": {
            "code": error_code,
            "status": status_code,
            "details": extra
        }
    }
