from redis_client import redis_client

try:
    response = redis_client.ping()
    print("Redis connection successful:", response)
except Exception as e:
    print("Redis connection failed:", e)
