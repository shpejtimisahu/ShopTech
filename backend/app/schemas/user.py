from pydantic import BaseModel, EmailStr, constr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: constr(min_length=6, max_length=72)


class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool = False

    class Config:
        from_attributes = True