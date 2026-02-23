from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class BaseAPIException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "INTERNAL_ERROR",
        extra: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra = extra or {}

class BadRequestException(BaseAPIException):
    def __init__(self, detail: str, error_code: str = "BAD_REQUEST", extra: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, error_code=error_code, extra=extra)

class UnauthorizedException(BaseAPIException):
    def __init__(self, detail: str = "Unauthorized", error_code: str = "UNAUTHORIZED"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, error_code=error_code)

class NotFoundException(BaseAPIException):
    def __init__(self, detail: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, error_code=error_code)

class InternalServerError(BaseAPIException):
    def __init__(self, detail: str = "Internal server error occurred", error_code: str = "INTERNAL_ERROR"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail, error_code=error_code)

class ValidationException(BadRequestException):
    def __init__(self, detail: str, extra: Optional[Dict[str, Any]] = None):
        super().__init__(detail=detail, error_code="VALIDATION_ERROR", extra=extra)
