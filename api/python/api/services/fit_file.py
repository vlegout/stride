import logging
import os

import yaml
from sqlmodel import Session

from api.fit import get_activity_from_fit
from api.model import Activity, Lap, Tracepoint
from api.services.storage import StorageService

logger = logging.getLogger(__name__)


class FitFileService:
    def __init__(self, session: Session, storage_service: StorageService | None = None):
        self.session = session
        self.storage_service = storage_service

    def get_fit_file_path(
        self,
        activity: Activity,
        fit_dir: str,
        download_from_s3: bool = False,
    ) -> str | None:
        path = os.path.join(fit_dir, activity.fit)

        if not os.path.abspath(path).startswith(os.path.abspath(fit_dir)):
            raise ValueError(
                f"Invalid FIT filename (path traversal detected): {activity.fit}"
            )

        if os.path.exists(path):
            return path

        if download_from_s3 and self.storage_service:
            if ".." in activity.fit or activity.fit.startswith("/"):
                raise ValueError(
                    f"Invalid FIT filename for S3 (contains path traversal): {activity.fit}"
                )

            s3_key = f"data/fit/{activity.fit}"

            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                self.storage_service.download_file(s3_key, path)
                return path
            except Exception as e:
                logger.debug(f"Failed to download {s3_key} from S3: {e}")
                return None

        return None

    def read_fit_from_yaml(
        self, yaml_file: str
    ) -> tuple[Activity, list[Lap], list[Tracepoint]]:
        with open(yaml_file, "r") as file:
            config = yaml.safe_load(file)

        activity, laps, tracepoints = get_activity_from_fit(
            self.session,
            "./data/fit/" + config["fit"],
            config.get("title", ""),
            config.get("description", ""),
            config.get("race", False),
        )

        return activity, laps, tracepoints

    def read_fit_file(
        self,
        input_file: str,
        title: str = "Activity",
        description: str = "",
        race: bool = False,
    ) -> tuple[Activity, list[Lap], list[Tracepoint]]:
        if input_file.endswith(".yaml"):
            return self.read_fit_from_yaml(input_file)
        else:
            return get_activity_from_fit(
                self.session, input_file, title, description, race
            )
