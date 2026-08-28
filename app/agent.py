import os

from google.adk.agents import Agent
from google.adk.tools import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

grafana_tools = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="mcp-grafana",
            args=[
                "-transport", "stdio",
                "-disable-write",
                "-enabled-tools", "datasource,prometheus,loki,dashboard,search",
            ],
            env={
                "GRAFANA_URL": os.environ["GRAFANA_URL"],
                "GRAFANA_SERVICE_ACCOUNT_TOKEN": os.environ[
                    "GRAFANA_SERVICE_ACCOUNT_TOKEN"
                ],
            },
        )
    )
)


root_agent = Agent(
    name="renderguard_investigator",
    model="gemini-3.5-flash",
    description=(
        "Investigates RenderGuard movie rendering pipeline incidents "
        "using Grafana observability data."
    ),
    instruction="""
You are the RenderGuard Investigation Agent.

Your job is to investigate failures in a 4K media rendering pipeline.

Use Grafana MCP tools to inspect real telemetry.

When investigating an incident:

1. Query Prometheus metrics to inspect worker health and GPU VRAM usage.
2. Query Loki logs when metrics show an abnormal worker.
3. Correlate metrics and logs before reaching a conclusion.
4. Never invent telemetry.
5. Clearly identify:
   - affected worker
   - observed metric anomaly
   - relevant log evidence
   - probable root cause
   - recommended next action

You are read-only. Do not attempt remediation.
""",
    tools=[grafana_tools],
)