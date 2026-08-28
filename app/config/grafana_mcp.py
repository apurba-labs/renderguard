import os

GRAFANA_URL = os.getenv(
    "GRAFANA_URL",
    "http://localhost:3000",
)

GRAFANA_SERVICE_ACCOUNT_TOKEN = os.getenv(
    "GRAFANA_SERVICE_ACCOUNT_TOKEN"
)