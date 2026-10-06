from pydantic import BaseModel, Field, AliasChoices


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Account username")
    password: str = Field(..., min_length=1, description="Account password")


class StudentLoginRequest(BaseModel):
    roll_no: str = Field(
        ...,
        min_length=1,
        validation_alias=AliasChoices("roll_no", "rollno", "usn"),
        description="Student roll number / USN",
    )
    password: str = Field(..., min_length=1, description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    username: str
    email: str | None = None


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=1)


class UserProfileResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    email: str | None = None
    rollno: str | None = None
