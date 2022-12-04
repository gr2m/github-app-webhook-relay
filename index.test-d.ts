import { expectType } from "tsd";
import { App } from "@octokit/app";

import GitHubWebHookRelay from "./index";

export function readmeExample() {
  const app = new App({
    appId: 123,
    privateKey: "",
    webhooks: {
      secret: "secret",
    },
  });

  const relay = new GitHubWebHookRelay({
    owner: "gr2m",
    repo: "github-webhooks-relay",
    app,
    createHookToken: "secret",
  });

  relay.on("webhook", ({ id, name, body, signature, headers }) => {
    expectType<string>(id);
    expectType<string>(name);
    expectType<string>(body);
    expectType<string>(signature);
    expectType<Record<string, string>>(headers);
  });

  relay.on("error", (error) => {
    expectType<Error>(error);
  });

  expectType<Promise<void>>(relay.start());
}
