import { config as loadEnv } from "dotenv";
import {
  createHiggsfieldClient,
  AuthenticationError,
  NotEnoughCreditsError,
  BadInputError,
  ValidationError,
  TimeoutError,
  APIError,
} from "@higgsfield/client/v2";

// Load HF_CREDENTIALS (key-id:key-secret) from .env.local at runtime. The value
// is never printed; only its presence is checked.
loadEnv({ path: ".env.local", quiet: true });

const MODEL = "bytedance/seedance-2.5/text-to-video";

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials) {
    console.error("HF_CREDENTIALS is not set. Add it to .env.local as key-id:key-secret.");
    return 1;
  }

  const client = createHiggsfieldClient({
    credentials,
    // Video generation can outlast the SDK's 5-minute default poll window.
    maxPollTime: 20 * 60 * 1000,
  });

  console.log(`Submitting request to ${MODEL}...`);
  const result = await client.subscribe(MODEL, {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    },
    withPolling: true,
  });

  // `canceled` is not in the SDK's status type but the API can return it.
  const status: string = result.status;
  const requestId = result.request_id;

  switch (status) {
    case "completed": {
      const url = result.video?.url;
      if (!url) {
        console.error(`Request ${requestId} completed but returned no video URL.`);
        return 1;
      }
      console.log(`Request ${requestId} completed.`);
      console.log(`Video URL: ${url}`);
      return 0;
    }
    case "failed":
      console.error(`Request ${requestId} failed (credits are refunded by Higgsfield).`);
      return 1;
    case "nsfw":
      console.error(`Request ${requestId} was rejected by content moderation.`);
      return 1;
    case "canceled":
      console.error(`Request ${requestId} was canceled.`);
      return 1;
    default:
      console.error(`Request ${requestId} ended with unexpected status "${status}".`);
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    if (error instanceof AuthenticationError) {
      console.error("Authentication failed: check HF_CREDENTIALS in .env.local.");
    } else if (error instanceof NotEnoughCreditsError) {
      // The SDK maps every HTTP 403 to this error, including proxy/firewall denials.
      console.error("HTTP 403: not enough credits, or access to api.higgsfield.ai was denied.");
    } else if (error instanceof BadInputError || error instanceof ValidationError) {
      console.error("Invalid input:", error.message);
    } else if (error instanceof TimeoutError) {
      console.error("Timed out waiting for the generation to finish:", error.message);
    } else if (error instanceof APIError) {
      console.error(`API error ${error.statusCode}:`, error.message);
    } else {
      console.error("Unexpected error:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  });
