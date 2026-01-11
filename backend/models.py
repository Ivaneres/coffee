from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    beans = relationship("Bean", back_populates="user", cascade="all, delete-orphan")
    records = relationship("EspressoRecord", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    default_machine = Column(String, nullable=True)
    default_grinder = Column(String, nullable=True)
    
    user = relationship("User", back_populates="settings")

class Bean(Base):
    __tablename__ = "beans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    variety = Column(String, nullable=False)
    seller = Column(String, nullable=True)
    roaster = Column(String, nullable=True)
    roast_level = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="beans")
    records = relationship("EspressoRecord", back_populates="bean", cascade="all, delete-orphan")

class EspressoRecord(Base):
    __tablename__ = "espresso_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bean_id = Column(Integer, ForeignKey("beans.id"), nullable=False)
    machine = Column(String, nullable=False)
    grinder = Column(String, nullable=False)
    grind_size = Column(String, nullable=True)
    dose = Column(Float, nullable=True)  # in grams
    extraction_time = Column(Float, nullable=True)  # in seconds
    yield_amount = Column(Float, nullable=True)  # in grams
    rating = Column(Integer, nullable=True)  # 1-10
    sourness = Column(Integer, nullable=True)  # 1-10
    bitterness = Column(Integer, nullable=True)  # 1-10
    sweetness = Column(Integer, nullable=True)  # 1-10
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="records")
    bean = relationship("Bean", back_populates="records")
