import os

from google.adk.agents import Agent
from google.adk.tools import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from app.tools.pipeline_control import quarantine_worker

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
    model="gemini-2.5-flash",
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

You may propose remediation after establishing evidence from
Prometheus and Loki.

The only permitted remediation capability is quarantine_worker.

Never assume that a requested remediation is authorized.
The pipeline policy is authoritative.

When remediation is requested:
1. Establish the affected worker and root cause from observability evidence.
2. Explain the proposed action.
3. Call quarantine_worker only for the affected worker.
4. Inspect the tool response.
5. Clearly report whether policy allowed or denied the action.

Never claim that remediation succeeded unless the tool response
confirms it.
""",
    tools=[
        grafana_tools,
        quarantine_worker,
    ],
)