FROM python:3.11-slim

# Системные библиотеки для opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU-сборка PyTorch (намного легче CUDA-версии с PyPI)
RUN pip install --no-cache-dir \
    torch==2.3.0 torchvision==0.18.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Остальные зависимости (torch/torchvision уже стоят — pip их пропустит)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Код приложения и веса модели
COPY . .

EXPOSE 8000

# Render/Railway передают порт в $PORT; локально по умолчанию 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
