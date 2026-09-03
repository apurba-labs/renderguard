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