from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Bean, User
from schemas import BeanCreate, BeanUpdate, BeanResponse
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=BeanResponse)
def create_bean(bean: BeanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_bean = Bean(**bean.dict(), user_id=current_user.id)
    db.add(db_bean)
    db.commit()
    db.refresh(db_bean)
    return db_bean

@router.get("/", response_model=List[BeanResponse])
def get_beans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    beans = db.query(Bean).filter(Bean.user_id == current_user.id).all()
    return beans

@router.get("/{bean_id}", response_model=BeanResponse)
def get_bean(bean_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bean = db.query(Bean).filter(Bean.id == bean_id, Bean.user_id == current_user.id).first()
    if not bean:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bean not found")
    return bean

@router.put("/{bean_id}", response_model=BeanResponse)
def update_bean(bean_id: int, bean_update: BeanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bean = db.query(Bean).filter(Bean.id == bean_id, Bean.user_id == current_user.id).first()
    if not bean:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bean not found")
    
    update_data = bean_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bean, field, value)
    
    db.commit()
    db.refresh(bean)
    return bean

@router.delete("/{bean_id}")
def delete_bean(bean_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bean = db.query(Bean).filter(Bean.id == bean_id, Bean.user_id == current_user.id).first()
    if not bean:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bean not found")
    
    db.delete(bean)
    db.commit()
    return {"message": "Bean deleted successfully"}
