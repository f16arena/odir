import json
import uuid
import io
import numpy as np
import cv2
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
import albumentations as A
from albumentations.pytorch import ToTensorV2

import state
import storage

CLASSES = ["N", "D", "G", "C", "A", "H", "M", "O"]
CLASS_NAMES = {
    "N": "Normal", "D": "Diabetes", "G": "Glaucoma", "C": "Cataract",
    "A": "AMD", "H": "Hypertension", "M": "Myopia", "O": "Other"
}
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model():
    model_path  = Path("models/best_efficientnet_b0.pth")
    config_path = Path("models/config.json")

    if not model_path.exists():
        raise FileNotFoundError(
            f"Модель не найдена: {model_path}\n"
            "Скачайте best_efficientnet_b0.pth из Google Drive в папку backend/models/"
        )

    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, len(CLASSES)),
    )

    checkpoint = torch.load(model_path, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state"])
    model.to(DEVICE)
    model.eval()

    print(f"  Модель: EfficientNet-B0 | val_auc={checkpoint.get('val_auc', '?')}")
    print(f"  Устройство: {DEVICE}")
    return model, config


def get_transforms(img_size=224):
    return A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])


class GradCAM:
    def __init__(self, model):
        self.model       = model
        self.gradients   = None
        self.activations = None
        model.features[-1].register_forward_hook(self._save_activation)
        model.features[-1].register_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, tensor, class_idx):
        self.model.zero_grad()
        output = self.model(tensor)
        output[0, class_idx].backward()
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam     = F.relu((weights * self.activations).sum(dim=1)).squeeze(0)
        cam     = cam.cpu().numpy()
        if cam.max() > 0:
            cam = (cam - cam.min()) / (cam.max() - cam.min())
        return cam


def overlay_heatmap(orig_img, cam, alpha=0.45):
    h, w = orig_img.shape[:2]
    cam_resized = cv2.resize(cam, (w, h))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    return (alpha * heatmap + (1 - alpha) * orig_img).astype(np.uint8)


def run_predict(image_arr: np.ndarray, img_filename: str) -> dict:
    """
    image_arr   : np.array (H, W, 3) RGB
    img_filename: имя сохранённого файла (для именования gradcam)

    Возвращает словарь с результатами.
    """
    model  = state.model
    config = state.config

    thresholds = config.get("thresholds", {cls: 0.5 for cls in CLASSES})
    img_size   = config.get("img_size", 224)

    transforms = get_transforms(img_size)
    tensor = transforms(image=image_arr)["image"].unsqueeze(0).to(DEVICE)

    model.eval()
    tensor_grad = tensor.clone().requires_grad_(True)

    with torch.enable_grad():
        logits = model(tensor_grad)
        probs  = torch.sigmoid(logits).detach().cpu().numpy()[0]

    detected = [
        cls for i, cls in enumerate(CLASSES)
        if float(probs[i]) >= float(thresholds.get(cls, 0.5))
    ]
    if not detected:
        detected = [CLASSES[int(np.argmax(probs))]]

    gradcam_path = None
    try:
        gradcam    = GradCAM(model)
        class_idx  = CLASSES.index(detected[0])
        tensor_gc  = tensor.clone().requires_grad_(True)
        cam        = gradcam.generate(tensor_gc, class_idx)
        overlay    = overlay_heatmap(image_arr, cam, alpha=0.45)

        gc_filename = f"gradcam_{img_filename}"
        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, "JPEG", quality=90)
        gradcam_path = storage.save_bytes(
            buf.getvalue(), f"gradcam/{gc_filename}", "image/jpeg"
        )
    except Exception as e:
        print(f"Grad-CAM ошибка: {e}")

    return {
        "probabilities":    {cls: round(float(probs[i]), 4) for i, cls in enumerate(CLASSES)},
        "detected_classes": detected,
        "gradcam_path":     gradcam_path,
        "model_version":    "efficientnet_b0_v1",
    }
