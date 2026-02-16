from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.prediction_logs import PredictionLog

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
def stats_summary(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Thống kê dựa trên prediction_logs của user hiện tại (giờ VN UTC+7),
    KHÔNG tính 'no_hand'.

    Trả:
    - gesture_stats: [{gesture, count}]
    - time_stats: [{time: "HH:00", predictions}]
    - total_predictions
    - most_used_gesture
    - days
    """

    # Tính khoảng thời gian theo "ngày VN", sau đó đổi về UTC để lọc DB
    now_utc = datetime.utcnow()
    now_vn = now_utc + timedelta(hours=7)
    since_vn = now_vn - timedelta(days=days)
    since_utc = since_vn - timedelta(hours=7)

    # ========== 1) Count theo gesture_label (loại no_hand) ==========
    gesture_rows = (
        db.query(PredictionLog.gesture_label, func.count(PredictionLog.id))
        .filter(PredictionLog.user_id == user.id)
        .filter(PredictionLog.created_at >= since_utc)
        .filter(PredictionLog.gesture_label != "no_hand")
        .group_by(PredictionLog.gesture_label)
        .order_by(func.count(PredictionLog.id).desc())
        .all()
    )

    gesture_stats = [{"gesture": g, "count": int(c)} for g, c in gesture_rows]
    total_predictions = sum(x["count"] for x in gesture_stats)
    most_used_gesture = gesture_stats[0]["gesture"] if gesture_stats else ""

    # ========== 2) Count theo giờ VN (loại no_hand) ==========
    # created_at đang là UTC -> cộng 7 giờ để ra VN rồi extract hour
    local_dt = func.date_add(PredictionLog.created_at, text("INTERVAL 7 HOUR"))
    hour_expr = func.extract("hour", local_dt)

    hour_rows = (
        db.query(hour_expr.label("h"), func.count(PredictionLog.id).label("c"))
        .filter(PredictionLog.user_id == user.id)
        .filter(PredictionLog.created_at >= since_utc)
        .filter(PredictionLog.gesture_label != "no_hand")
        .group_by(hour_expr)
        .order_by(hour_expr)
        .all()
    )

    hour_map = {int(h): int(c) for h, c in hour_rows if h is not None}
    time_stats = [{"time": f"{h:02d}:00", "predictions": hour_map.get(h, 0)} for h in range(24)]

    return {
        "gesture_stats": gesture_stats,
        "time_stats": time_stats,
        "total_predictions": total_predictions,
        "most_used_gesture": most_used_gesture,
        "days": days,
    }
