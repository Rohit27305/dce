import json
import uuid
from datetime import datetime

class CustomJSONEncoder(json.JSONEncoder):
    """
    JSON Encoder that handles UUIDs and datetimes.
    """
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def json_dumps(obj, **kwargs) -> str:
    """
    Helper to dump JSON with the custom encoder.
    """
    return json.dumps(obj, cls=CustomJSONEncoder, **kwargs)
