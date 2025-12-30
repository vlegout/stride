class ServiceError(Exception):
    """Base exception for all service errors."""

    pass


class StorageServiceError(ServiceError):
    """Base exception for storage service errors."""

    pass
