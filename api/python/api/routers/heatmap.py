from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_current_user_id, get_heatmap_service_dependency
from api.model import HeatmapPublic
from api.services.heatmap import HeatmapService

router = APIRouter()


@router.get("/heatmap/", response_model=HeatmapPublic)
def read_heatmap(
    user_id: str = Depends(get_current_user_id),
    heatmap_service: HeatmapService = Depends(get_heatmap_service_dependency),
):
    heatmap = heatmap_service.get_heatmap(user_id)
    if not heatmap:
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return heatmap
