export const PUSH_TOPICS = ["weather", "water", "community"] as const;

export type PushTopic = (typeof PUSH_TOPICS)[number];

export type StoredPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  topics: PushTopic[];
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  urgency?: "very-low" | "low" | "normal" | "high";
  requireInteraction?: boolean;
  renotify?: boolean;
  topic?: PushTopic;
};

export type PushDeliveryResult = {
  total: number;
  sent: number;
  failed: number;
  removed: number;
};
