from passlib.context import CryptContext

# bcrypt is the industry standard for password hashing.
# It includes automatic salting and is intentionally slow to resist brute-force attacks.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt has a hard limit of 72 bytes — longer passwords must be truncated.
BCRYPT_MAX_BYTES = 72


def _truncate(password: str) -> str:
    # Encode to bytes, cut to 72 bytes, decode back (ignore partial multibyte chars)
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES].decode("utf-8", "ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_truncate(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_truncate(plain_password), hashed_password)
