#!/usr/bin/env python3
"""
Python FastAPI backend server with async support
Modern, fast web framework for building APIs
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
from enum import Enum

# Initialize FastAPI app
app = FastAPI(
    title="User Management API",
    description="Modern API for user management with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"

# Pydantic models for request/response validation
class UserPreferences(BaseModel):
    theme: Theme = Theme.LIGHT
    notifications: bool = True
    language: str = "en"
    timezone: str = "UTC"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    preferences: Optional[UserPreferences] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    preferences: Optional[UserPreferences] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    preferences: UserPreferences

    class Config:
        from_attributes = True

# In-memory data store (in production, use a database)
users_db = {}
user_counter = 1

# Dependency for getting user by ID
async def get_user(user_id: int) -> Optional[User]:
    """Get user by ID from database"""
    user_data = users_db.get(user_id)
    if user_data:
        return User(**user_data)
    return None

# Routes

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to User Management API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "user-management-api"
    }

@app.get("/api/users", response_model=List[User])
async def get_users(
    skip: int = 0,
    limit: int = 10,
    role: Optional[UserRole] = None,
    search: Optional[str] = None
):
    """Get all users with optional filtering"""
    users = list(users_db.values())

    # Filter by role
    if role:
        users = [u for u in users if u["role"] == role]

    # Filter by search term
    if search:
        search_lower = search.lower()
        users = [
            u for u in users
            if search_lower in u["name"].lower() or search_lower in u["email"].lower()
        ]

    # Pagination
    return users[skip:skip + limit]

@app.get("/api/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: int):
    """Get user by ID"""
    user = await get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@app.post("/api/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create new user"""
    global user_counter

    # Check if email already exists
    for existing_user in users_db.values():
        if existing_user["email"] == user.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )

    # Create new user
    new_user_data = {
        "id": user_counter,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "preferences": user.preferences or UserPreferences()
    }

    users_db[user_counter] = new_user_data
    user_counter += 1

    return User(**new_user_data)

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: int, user_update: UserUpdate):
    """Update existing user"""
    user_data = users_db.get(user_id)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if email already exists (excluding current user)
    if user_update.email:
        for existing_id, existing_user in users_db.items():
            if existing_id != user_id and existing_user["email"] == user_update.email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists"
                )

    # Update user data
    update_data = user_update.dict(exclude_unset=True)
    user_data.update(update_data)

    return User(**user_data)

@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Delete user"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    del users_db[user_id]

@app.get("/api/stats")
async def get_stats():
    """Get user statistics"""
    total_users = len(users_db)
    active_users = sum(1 for u in users_db.values() if u["is_active"])
    role_counts = {}
    for user in users_db.values():
        role = user["role"]
        role_counts[role] = role_counts.get(role, 0) + 1

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "role_distribution": role_counts,
        "generated_at": datetime.utcnow().isoformat()
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": "http_exception"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "server_error"}
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize data on startup"""
    print("🚀 Starting User Management API...")
    print(f"📚 Documentation available at: http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down User Management API...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
