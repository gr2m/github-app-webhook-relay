import test from "ava";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";
import { WebSocketServer } from "ws";
import getPort from "get-port";

import WebhookRelay from "../index.js";

import { issuesOpenEvent } from "./fixtures/issues.open.js";

const TestOctokit = Octokit.plugin((octokit, { t, port }) => {
  octokit.hook.wrap("request", (request, options) => {
    const route = `${options.method} ${options.url}`;

    if (route === "GET /app") {
      return {
        data: {
          slug: "test-app",
          events: ["issues"],
        },
      };
    }

    if (
      [
        "GET /repos/{owner}/{repo}/installation",
        "GET /orgs/{org}/installation",
      ].includes(route)
    ) {
      return {
        data: {
          id: 1,
        },
      };
    }

    options.headers["user-agent"] = "test";
    t.snapshot(options, route);

    return {
      data: {
        ws_url: `ws://localhost:${port}`,
        id: 1,
      },
    };
  });
}).defaults({
  auth: "secret123",
});

const TestApp = App.defaults({
  appId: 1,
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf9Cnzj4p4WGeKLs1Pt8Qu
KUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQJAIJLixBy2qpFoS4DSmoEm
o3qGy0t6z09AIJtH+5OeRV1be+N4cDYJKffGzDa88vQENZiRm0GRq6a+HPGQMd2k
TQIhAKMSvzIBnni7ot/OSie2TmJLY4SwTQAevXysE2RbFDYdAiEBCUEaRQnMnbp7
9mxDXDf6AU0cN/RPBjb9qSHDcWZHGzUCIG2Es59z8ugGrDY+pxLQnwfotadxd+Uy
v/Ow5T0q5gIJAiEAyS4RaI9YG8EWx/2w0T67ZUVAw8eOMB6BIUg0Xcu+3okCIBOs
/5OiPgoTdSy7bcF9IGpSE8ZgGKzgYQVZeN97YE00
-----END RSA PRIVATE KEY-----
`,
  webhooks: {
    secret: "secret",
  },
  Octokit: TestOctokit,
});

test("README example", async (t) => {
  return new Promise(async (resolve, reject) => {
    const port = await getPort();
    const octokit = new TestOctokit({ t, port });

    const wss = new WebSocketServer({ port });

    wss.on("connection", function connection(ws) {
      ws.on("message", (data) => {
        t.snapshot(data.toString(), "response");

        ws.close();
        wss.close();
      });

      ws.send(JSON.stringify(issuesOpenEvent));
    });

    octokit.hook.wrap("request", (request, options) => {
      const route = `${options.method} ${options.url}`;
      options.headers["user-agent"] = "test";
      t.snapshot(options, route);

      return {
        data: {
          ws_url: `ws://localhost:${port}`,
          id: 1,
        },
      };
    });

    const app = new TestApp();

    const relay = new WebhookRelay({
      owner: "gr2m",
      repo: "github-webhooks-relay",
      octokit,
      app,
    });

    wss.on("error", reject);
    relay.on("error", reject);

    let startReceived;
    let appWebhookReceived;
    let relayWebhookReceived;
    app.webhooks.on("issues.opened", (event) => {
      appWebhookReceived = true;
      t.snapshot(event.payload, "app webhook payload for issues.opened");
    });

    relay.on("start", () => (startReceived = true));
    relay.on("webhook", (event) => {
      relayWebhookReceived = true;
      t.snapshot(event, "relay webhook");
    });
    relay.on("stop", () => {
      t.true(startReceived, "start event received");
      t.true(appWebhookReceived, "app webhook received");
      t.true(relayWebhookReceived, "relay webhook received");

      resolve();
    });

    wss.on("listening", async () => {
      relay.start();
    });
  });
});

test("organization reelay", async (t) => {
  return new Promise(async (resolve, reject) => {
    const port = await getPort();
    const octokit = new TestOctokit({ t, port });

    const wss = new WebSocketServer({ port });

    wss.on("connection", function connection(ws) {
      ws.on("message", (data) => {
        t.snapshot(data.toString(), "response");

        ws.close();
        wss.close();
      });

      ws.send(JSON.stringify(issuesOpenEvent));
    });

    octokit.hook.wrap("request", (request, options) => {
      const route = `${options.method} ${options.url}`;
      options.headers["user-agent"] = "test";
      t.snapshot(options, route);

      return {
        data: {
          ws_url: `ws://localhost:${port}`,
          id: 1,
        },
      };
    });

    const app = new TestApp();

    const relay = new WebhookRelay({
      owner: "gr2m-sandbox",
      octokit,
      app,
    });

    wss.on("error", reject);
    relay.on("error", reject);

    let startReceived;
    let appWebhookReceived;
    let relayWebhookReceived;
    app.webhooks.on("issues.opened", (event) => {
      appWebhookReceived = true;
      t.snapshot(event.payload, "app webhook payload for issues.opened");
    });

    relay.on("start", () => (startReceived = true));
    relay.on("webhook", (event) => {
      relayWebhookReceived = true;
      t.snapshot(event, "relay webhook");
    });
    relay.on("stop", () => {
      t.true(startReceived, "start event received");
      t.true(appWebhookReceived, "app webhook received");
      t.true(relayWebhookReceived, "relay webhook received");

      resolve();
    });

    wss.on("listening", async () => {
      relay.start();
    });
  });
});
