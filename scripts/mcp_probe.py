import asyncio
import json
import os

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main() -> None:
    server = StdioServerParameters(
        command="uvx",
        args=[
            "mcp-grafana",
            "-transport",
            "stdio",
            "-disable-write",
            "-enabled-tools",
            "datasource,prometheus,loki,dashboard,search",
        ],
        env={
            **os.environ,
            "GRAFANA_URL": os.environ["GRAFANA_URL"],
            "GRAFANA_SERVICE_ACCOUNT_TOKEN": os.environ[
                "GRAFANA_SERVICE_ACCOUNT_TOKEN"
            ],
        },
    )

    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            print("\n=== MCP TOOLS ===")
            tools = await session.list_tools()

            for tool in tools.tools:
                if tool.name == "query_prometheus":
                    print(tool.name)
                    print(json.dumps(tool.input_schema, indent=2))
                    
                for tool in tools.tools:
                    if tool.name == "query_loki_logs":
                        print(json.dumps(tool.input_schema, indent=2))

            print("\n=== DATASOURCES ===")
            datasources = await session.call_tool(
                "list_datasources",
                {},
            )
            print_result(datasources)

            print("\n=== PROMETHEUS QUERY ===")
            prometheus_result = await session.call_tool(
                "query_prometheus",
                {
                    "datasourceUid": "PBFA97CFB590B2093",
                    "expr": (
                        'renderguard_worker_vram_percent'
                        '{worker_id="render-gpu-03"}'
                    ),
                    "queryType": "instant",
                    "endTime": "now",
                },
            )
            print_result(prometheus_result)


def print_result(result) -> None:
    for item in result.content:
        text = getattr(item, "text", None)

        if text:
            try:
                parsed = json.loads(text)
                print(json.dumps(parsed, indent=2))
            except json.JSONDecodeError:
                print(text)


if __name__ == "__main__":
    asyncio.run(main())