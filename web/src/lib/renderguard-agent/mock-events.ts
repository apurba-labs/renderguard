import type { AdkEvent } from "./types";

export const mockInvestigationEvents: AdkEvent[] = [
  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-health",
            name: "query_prometheus",
            args: {
              expr: "renderguard_worker_health",
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-health",
            name: "query_prometheus",
            response: {
              data: [
                {
                  metric: {
                    __name__: "renderguard_worker_health",
                    worker_id: "render-gpu-03",
                  },
                  value: [1, "0"],
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-vram",
            name: "query_prometheus",
            args: {
              expr: "renderguard_worker_vram_percent",
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-vram",
            name: "query_prometheus",
            response: {
              data: [
                {
                  metric: {
                    __name__:
                      "renderguard_worker_vram_percent",
                    worker_id: "render-gpu-03",
                  },
                  value: [2, "97"],
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-active-before",
            name: "query_prometheus",
            args: {
              expr:
                'renderguard_worker_active_chunks{worker_id="render-gpu-03"}',
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-active-before",
            name: "query_prometheus",
            response: {
              data: [
                {
                  metric: {
                    __name__:
                      "renderguard_worker_active_chunks",
                    worker_id: "render-gpu-03",
                  },
                  value: [3, "2"],
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-loki-evidence",
            name: "query_loki_logs",
            args: {
              logql:
                '{worker_id="render-gpu-03"}',
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-loki-evidence",
            name: "query_loki_logs",
            response: {
              data: [
                {
                  line:
                    '{"event":"gpu_memory_pressure","worker_id":"render-gpu-03","vram_percent":97}',
                },
                {
                  line:
                    '{"event":"render_chunk_failed","worker_id":"render-gpu-03","reason":"CUDA_OUT_OF_MEMORY"}',
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-quarantine",
            name: "quarantine_worker",
            args: {
              worker_id: "render-gpu-03",
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-quarantine",
            name: "quarantine_worker",
            response: {
              allowed: true,
              reason:
                "Worker satisfies the quarantine safety policy.",
              worker: {
                worker_id: "render-gpu-03",
                status: "quarantined",
                active_chunks: 0,
              },
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-active-after",
            name: "query_prometheus",
            args: {
              expr:
                'renderguard_worker_active_chunks{worker_id="render-gpu-03"}',
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-active-after",
            name: "query_prometheus",
            response: {
              data: [
                {
                  metric: {
                    __name__:
                      "renderguard_worker_active_chunks",
                    worker_id: "render-gpu-03",
                  },
                  value: [4, "0"],
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionCall: {
            id: "call-loki-verify",
            name: "query_loki_logs",
            args: {
              logql:
                '{worker_id="render-gpu-03", event="worker_quarantined"}',
            },
          },
        },
      ],
    },
  },

  {
    content: {
      parts: [
        {
          functionResponse: {
            id: "call-loki-verify",
            name: "query_loki_logs",
            response: {
              data: [
                {
                  line:
                    '{"event":"worker_quarantined","worker_id":"render-gpu-03","status":"quarantined"}',
                },
              ],
            },
          },
        },
      ],
    },
  },
];