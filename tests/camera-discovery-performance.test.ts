import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cameras = readFileSync("src/lib/cameras/cameras.server.ts", "utf8");
const youtube = readFileSync("src/lib/cameras/youtube.server.ts", "utf8");

test("configured Laranjal embed skips external YouTube discovery", () => {
  assert.match(cameras, /configuredLaranjalEmbedUrl/);
  assert.match(
    cameras,
    /configuredLaranjalEmbedUrl \? null : await getLatestLaranjalStream\(\)/,
  );
});

test("YouTube fallback requests use a bounded five-second budget", () => {
  assert.match(youtube, /const REQUEST_TIMEOUT_MS = 5_000/);
  assert.match(youtube, /const signal = AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(youtube, /youtubeRequest<ChannelResponse>[\s\S]*apiKey,[\s\S]*signal/);
  assert.match(youtube, /youtubeRequest<PlaylistResponse>[\s\S]*apiKey,[\s\S]*signal/);
  assert.match(youtube, /youtubeRequest<VideosResponse>[\s\S]*apiKey,[\s\S]*signal/);
});

test("API, public live page and RSS fallback are resolved in parallel", () => {
  assert.match(youtube, /const apiStreamPromise/);
  assert.match(youtube, /const publicStreamPromise/);
  assert.match(youtube, /const latestReplayPromise/);
  assert.match(
    youtube,
    /Promise\.all\(\[[\s\S]*apiStreamPromise,[\s\S]*publicStreamPromise,[\s\S]*latestReplayPromise,[\s\S]*\]\)/,
  );
  assert.match(youtube, /if \(apiStream\?\.status === "live"\) return apiStream/);
  assert.match(youtube, /if \(publicStream\) return publicStream/);
  assert.match(youtube, /if \(latestReplay\) return latestReplay/);
});
