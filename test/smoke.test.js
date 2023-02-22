import test from "ava";
import { App } from "@octokit/app";

import WebhookRelay from "../index.js";

test("repository relay", (t) => {
  t.true(WebhookRelay instanceof Function);

  const app = new App({
    appId: 1,
    privateKey: "<private key>",
    webhooks: {
      secret: "secret123",
    },
  });

  const relay = new WebhookRelay({
    owner: "gr2m",
    repo: "github-webhooks-relay",
    createHookToken: "token",
    app,
  });

  t.true(relay.on instanceof Function);
  t.true(relay.start instanceof Function);
  t.true(relay.stop instanceof Function);
});

test("organization relay", (t) => {
  t.true(WebhookRelay instanceof Function);

  const app = new App({
    appId: 1,
    privateKey: "<private key>",
    webhooks: {
      secret: "secret123",
    },
  });

  const relay = new WebhookRelay({
    owner: "gr2m-sandbox",
    createHookToken: "token",
    app,
  });

  t.true(relay.on instanceof Function);
  t.true(relay.start instanceof Function);
  t.true(relay.stop instanceof Function);
});
