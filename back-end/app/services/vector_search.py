"""MongoDB Atlas vector search service for medical condition matching."""

from pymongo import MongoClient
from app.config import settings


def get_mongo_client() -> MongoClient:
    """Create and return a MongoDB client."""
    return MongoClient(settings.MONGODB_URI)


def get_collection(client: MongoClient, collection_name: str = "medical_conditions"):
    """Get a collection from the configured database."""
    db = client[settings.MONGODB_DB_NAME]
    return db[collection_name]


async def search_conditions(
    client: MongoClient, query_vector: list, top_k: int = 5
) -> list:
    """Run a $vectorSearch aggregation against the medical_conditions collection."""
    collection = get_collection(client)
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": top_k * 20,
                "limit": top_k,
            }
        },
        {
            "$project": {
                "condition": 1,
                "title": 1,
                "snippet": 1,
                "pmcid": 1,
                "score": {"$meta": "vectorSearchScore"},
                "_id": 0,
            }
        },
    ]
    results = list(collection.aggregate(pipeline))
    return results
