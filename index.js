// @ts-check

import { EventEmitter } from "node:events";

import start from "./api/start.js";
import stop from "./api/stop.js";

export default class GitHubAppWebHookRelay {
  /**
   * @param {import("./internal").Options} options
   */
  constructor(options) {
    /** @type {import("./internal").State} */
    const state = {
      owner: options.owner,
      repo: options.repo,
      events: options.events,
      app: options.app,
      eventEmitter: new EventEmitter(),
      // @ts-expect-error - complaints because it's either/or
      createHookToken: options.createHookToken,
      // @ts-expect-error - complaints because it's either/or
      octokit: options.octokit,
    };

    this.on = state.eventEmitter.addListener.bind(state.eventEmitter);
    this.start = start.bind(null, state);
    this.stop = stop.bind(null, state);
  }
}
