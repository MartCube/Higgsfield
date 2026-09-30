# Higgsfield Seedance 2.5 example

Generates a 5 s, 720p, 16:9 video with `bytedance/seedance-2.5/text-to-video`
through the official [`@higgsfield/client`](https://www.npmjs.com/package/@higgsfield/client) v2 SDK (`subscribe`).

## Setup

```bash
npm install
cp .env.example .env.local   # then set HF_CREDENTIALS=key-id:key-secret in your editor
```

`.env.local` is git-ignored. Credentials are loaded server-side at runtime and never printed.

## Run (billable)

```bash
npm start
```

Prints the video URL on success. Exits non-zero on `failed`, `nsfw` (moderated),
`canceled`, timeout, or API errors.
