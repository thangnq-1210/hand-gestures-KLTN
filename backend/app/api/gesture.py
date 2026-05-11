
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models import UserGestureMapping, GestureDictionary
from ..db import get_db
from .. import models
from ..schemas.gesture import (
    GestureMappingEffective,
    UpdateUserGestureMapping,
)
from ..core.security import get_current_user


router = APIRouter(prefix="/gestures", tags=["gestures"])


@router.get("/my-mapping", response_model=List[GestureMappingEffective])
def get_my_gesture_mapping(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dictionaries = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.is_active == True)
        .all()
    )

    user_mappings = (
        db.query(models.UserGestureMapping)
        .filter(models.UserGestureMapping.user_id == current_user.id)
        .all()
    )
    mapping_by_label = {m.model_label: m for m in user_mappings}

    result: list[GestureMappingEffective] = []
    for d in dictionaries:
        m = mapping_by_label.get(d.model_label)
        custom = m.custom_text if m else None
        effective = custom or d.default_text

        result.append(
            GestureMappingEffective(
                model_label=d.model_label,
                default_text=d.default_text,
                custom_text=custom,
                effective_text=effective,
            )
        )

    result.sort(key=lambda x: x.model_label)
    return result


@router.put("/my-mapping/{model_label}", response_model=GestureMappingEffective)
def upsert_my_gesture_mapping(
    model_label: str,
    data: UpdateUserGestureMapping,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    d = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.model_label == model_label)
        .first()
    )
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cử chỉ không tồn tại trong từ điển",
        )

    m = (
        db.query(models.UserGestureMapping)
        .filter(
            models.UserGestureMapping.user_id == current_user.id,
            models.UserGestureMapping.model_label == model_label,
        )
        .first()
    )

    if m:
        m.custom_text = data.custom_text
    else:
        m = models.UserGestureMapping(
            user_id=current_user.id,
            model_label=model_label,
            custom_text=data.custom_text,
        )
        db.add(m)

    db.commit()
    db.refresh(m)

    return GestureMappingEffective(
        model_label=model_label,
        default_text=d.default_text,
        custom_text=m.custom_text,
        effective_text=m.custom_text or d.default_text,
    )


@router.delete("/my-mapping/{model_label}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_gesture_mapping(
    model_label: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Xoá override, quay lại dùng default_text
    """
    m = (
        db.query(models.UserGestureMapping)
        .filter(
            models.UserGestureMapping.user_id == current_user.id,
            models.UserGestureMapping.model_label == model_label,
        )
        .first()
    )

    if not m:
        # không có gì để xoá → trả 204 luôn
        return

    db.delete(m)
    db.commit()

