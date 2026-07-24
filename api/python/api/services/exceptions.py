class ServiceError(Exception):
    """Base exception for all service errors."""


class StorageServiceError(ServiceError):
    """Base exception for storage service errors."""
