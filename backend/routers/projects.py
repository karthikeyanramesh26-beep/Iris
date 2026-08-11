from fastapi import APIRouter
from models.schemas import ProjectCreateRequest, ProjectRenameRequest
import database

router = APIRouter()

@router.get("/api/projects")
def get_projects():
    return {"projects": database.get_projects()}

@router.post("/api/projects")
def create_project(request: ProjectCreateRequest):
    return database.create_project(request.projectId, request.name)

@router.put("/api/projects/{project_id}")
def rename_project(project_id: str, request: ProjectRenameRequest):
    return database.rename_project(project_id, request.name)

@router.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    database.delete_project(project_id)
    return {"status": "success"}
