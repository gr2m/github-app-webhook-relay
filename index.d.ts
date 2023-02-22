import { EventPayloadMap } from "@octokit/webhooks-types";
import { Octokit } from "@octokit/core";
import { App } from "@octokit/app";

export namespace GitHubAppWebHookRelay {
  interface Options {
    owner: string;
    repo?: string;
    app: App;
    events?: (keyof EventPayloadMap)[];
  }

  interface OptionsWithCreateHookToken extends GitHubAppWebHookRelay.Options {
    createHookToken: string;
  }
  interface OptionsWithOctokit extends GitHubAppWebHookRelay.Options {
    octokit: Octokit;
  }
}

type WebhookEvent = {
  /** GitHub Wekhook Delivery GUID */
  id: string;
  /**
   * GitHub Wekhook event name
   *
   * @example "issues"
   * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads
   */
  name: string;
  /**
   * GitHub Wekhook event payload as JSON string.
   *
   * The webhook payload received from the repository webhook is parsed and an `installation: { id }` property is added. The payload is then stringified and the signature is calculated and added. The payload is passed as as string as parsing the JSON and later stringifying it again bight result in a signature mismatch.
   */
  body: string;
  /**
   * Headers of the GitHub Wekhook request.
   */
  headers: Record<string, string>;
  /**
   * If a `webhookSecret` was provide, the signature will be set sha-256 digest of the payload and the secret.
   */
  signature: string;
};

interface AddEventListener {
  (eventName: "start", listener: () => unknown): void;
  (eventName: "stop", listener: () => unknown): void;
  (eventName: "error", listener: (error: Error) => unknown): void;
  (eventName: "webhook", listener: (event: WebhookEvent) => unknown): void;
}

export default class GitHubAppWebHookRelay {
  constructor(
    options:
      | GitHubAppWebHookRelay.OptionsWithCreateHookToken
      | GitHubAppWebHookRelay.OptionsWithOctokit
  );

  start(): Promise<void>;
  stop(): Promise<void>;
  on: AddEventListener;
}
