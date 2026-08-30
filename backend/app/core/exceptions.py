from fastapi import HTTPException, status


class DataVizAIException(Exception):
    """Base exception for DataViz AI."""
    pass


class DatasetNotFoundError(DataVizAIException):
    pass


class DatasetProcessingError(DataVizAIException):
    pass


class StorageError(DataVizAIException):
    pass


class AIAgentError(DataVizAIException):
    pass


class AuthenticationError(DataVizAIException):
    pass


class AuthorizationError(DataVizAIException):
    pass


def not_found(detail: str = "Resource not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def bad_request(detail: str = "Bad request") -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def unauthorized(detail: str = "Unauthorized") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def forbidden(detail: str = "Forbidden") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def internal_error(detail: str = "Internal server error") -> HTTPException:
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
