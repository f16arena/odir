"""
Абстракция хранилища файлов (снимки и Grad-CAM).

Если заданы переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY —
файлы загружаются в Supabase Storage и возвращается публичный URL.
Иначе (локальная разработка) файлы пишутся на диск и возвращается
относительный путь, который раздаёт FastAPI через StaticFiles.
"""
import os
from pathlib import Path

SUPABASE_URL     = os.getenv("SUPABASE_URL")
SUPABASE_KEY     = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET  = os.getenv("SUPABASE_BUCKET", "scans")

USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)

_client = None
if USE_SUPABASE:
    from supabase import create_client
    _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"  Хранилище: Supabase Storage (bucket={SUPABASE_BUCKET})")
else:
    print("  Хранилище: локальный диск (uploads/, gradcam/)")


def save_bytes(data: bytes, rel_path: str, content_type: str = "image/jpeg") -> str:
    """
    data     : содержимое файла
    rel_path : относительный путь-ключ, например 'uploads/<uuid>.jpg'

    Возвращает URL/путь для сохранения в БД и отдачи фронтенду.
    """
    if USE_SUPABASE:
        _client.storage.from_(SUPABASE_BUCKET).upload(
            path=rel_path,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return _client.storage.from_(SUPABASE_BUCKET).get_public_url(rel_path)

    full = Path(rel_path)
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_bytes(data)
    return f"/{rel_path}"
