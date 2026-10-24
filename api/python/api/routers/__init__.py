from . import activities, auth, best, fitness, heatmap, profile, users, weeks

routers = [
    activities.router,
    profile.router,
    best.router,
    weeks.router,
    users.router,
    auth.router,
    fitness.router,
    heatmap.router,
]

__all__ = ["routers"]
