import { EventEmitter } from "node:events";

import { EventPayloadMap } from "@octokit/webhooks-types";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";
import Relay from "github-webhook-relay";

import { GitHubAppWebHookRelay } from "./index";

export type Options =
  | GitHubAppWebHookRelay.OptionsWithCreateHookToken
  | GitHubAppWebHookRelay.OptionsWithOctokit;

export type State = {
  owner: string;
  repo: string;
  eventEmitter: EventEmitter;
  app: App;
  events?: (keyof EventPayloadMap)[];
  createHookToken?: string;
  octokit?: Octokit;
  relay?: Relay;
};
