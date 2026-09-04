export type AgentStage =
  | "observe"
  | "correlate"
  | "decide"
  | "guard"
  | "act"
  | "verify"
  | "complete";

export type AgentStageStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type AgentActivitySource =
  | "Prometheus"
  | "Loki"
  | "Gemini"
  | "Policy"
  | "Pipeline";

export type AgentActivityStatus =
  | "running"
  | "success"
  | "failed";

export type AgentActivity = {
  id: string;
  source: AgentActivitySource;
  status: AgentActivityStatus;
  message: string;
};

export type RenderGuardAgentEvent = {
  stage: AgentStage;
  status: AgentStageStatus;
  message: string;
};

export type AdkFunctionCall = {
  id: string;
  name: string;
  args?: Record<string, unknown>;
};

export type AdkFunctionResponse = {
  id?: string;
  name: string;
  response?: Record<string, unknown>;
};

export type AdkPart = {
  text?: string;
  functionCall?: AdkFunctionCall;
  functionResponse?: AdkFunctionResponse;
};

export type AdkEvent = {
  partial?: boolean;
  content?: {
    parts?: AdkPart[];
    role?: string;
  };
  invocationId?: string;
  author?: string;
};