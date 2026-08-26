from pydantic import BaseModel, ConfigDict, Field


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Subject title or name")


class SubjectResponse(BaseModel):
    id: int
    name: str
    faculty_id: int

    model_config = ConfigDict(from_attributes=True)


class BatchCreate(BaseModel):
    batchname: str = Field(..., min_length=1, description="Batch section or group name")


class BatchResponse(BaseModel):
    id: int
    subject_id: int
    batchname: str

    model_config = ConfigDict(from_attributes=True)


class EnrollmentCreate(BaseModel):
    student_id: int = Field(..., gt=0, description="Student ID to enroll")


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    batch_id: int

    model_config = ConfigDict(from_attributes=True)


class StudentResponse(BaseModel):
    id: int
    name: str
    rollno: str
    username: str

    model_config = ConfigDict(from_attributes=True)
