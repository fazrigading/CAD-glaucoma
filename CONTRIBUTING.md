# Contributing to CAD-Glaucoma

Thank you for your interest in contributing to this research project. Please review the following setup instructions carefully.

## Model Files Setup

The U-Net model files (`unet_model_aug.h5` and `unet_model_ori.h5`) are **not included** in this repository. They are stored in a separate private GitHub repository and must be downloaded separately.

### Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated
- Access granted to the private model repository (`fazrigading/cad-glaucoma-models`)

### Download Model Files

After cloning this repository, run the following script to download the model files:

```bash
bash backend/model/download_models.sh
```

This will download the `.h5` model files into `backend/model/`. The backend requires these files to run predictions.

### Manual Download (Alternative)

If you prefer to download manually:

1. Go to the [private model repository releases](https://github.com/fazrigading/cad-glaucoma-models/releases)
2. Download the `.h5` files from the latest release
3. Place them in `backend/model/`

### Requesting Access

If you do not have access to the model repository, contact the project maintainers to be added as a collaborator.

---

## Development Setup

See the main [README.md](README.md) for full setup instructions including database, backend, and frontend configuration.
