from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql://postgres:root@localhost:5432/postgis"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)