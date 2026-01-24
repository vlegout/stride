from sqlmodel import create_engine

from api.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
