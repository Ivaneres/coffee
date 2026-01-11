from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import EspressoRecord, Bean, User, UserSettings
from schemas import EspressoRecordCreate, EspressoRecordUpdate, EspressoRecordResponse
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=EspressoRecordResponse)
def create_record(record: EspressoRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify bean belongs to user
    bean = db.query(Bean).filter(Bean.id == record.bean_id, Bean.user_id == current_user.id).first()
    if not bean:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bean not found")
    
    # Get user defaults if machine/grinder not provided or empty
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    machine = record.machine.strip() if record.machine else ''
    grinder = record.grinder.strip() if record.grinder else ''
    
    if user_settings:
        if (not machine or machine == '') and user_settings.default_machine:
            machine = user_settings.default_machine
        if (not grinder or grinder == '') and user_settings.default_grinder:
            grinder = user_settings.default_grinder
    
    # Ensure machine and grinder are set
    if not machine:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Machine is required")
    if not grinder:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grinder is required")
    
    # Create record dict excluding machine/grinder to avoid duplicates
    record_data = record.dict(exclude={'machine', 'grinder'})
    db_record = EspressoRecord(
        **record_data,
        user_id=current_user.id,
        machine=machine,
        grinder=grinder
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/", response_model=List[EspressoRecordResponse])
def get_records(
    bean_id: Optional[int] = None,
    machine: Optional[str] = None,
    grinder: Optional[str] = None,
    bean_variety: Optional[str] = None,
    bean_roaster: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EspressoRecord).filter(EspressoRecord.user_id == current_user.id)
    
    if bean_id:
        query = query.filter(EspressoRecord.bean_id == bean_id)
    if machine:
        query = query.filter(EspressoRecord.machine.ilike(f"%{machine}%"))
    if grinder:
        query = query.filter(EspressoRecord.grinder.ilike(f"%{grinder}%"))
    if bean_variety or bean_roaster:
        query = query.join(Bean)
        if bean_variety:
            query = query.filter(Bean.variety.ilike(f"%{bean_variety}%"))
        if bean_roaster:
            query = query.filter(Bean.roaster.ilike(f"%{bean_roaster}%"))
    
    records = query.order_by(EspressoRecord.created_at.desc()).all()
    return records

@router.get("/{record_id}", response_model=EspressoRecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(EspressoRecord).filter(
        EspressoRecord.id == record_id,
        EspressoRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record

@router.put("/{record_id}", response_model=EspressoRecordResponse)
def update_record(
    record_id: int,
    record_update: EspressoRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(EspressoRecord).filter(
        EspressoRecord.id == record_id,
        EspressoRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    
    update_data = record_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(EspressoRecord).filter(
        EspressoRecord.id == record_id,
        EspressoRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}
