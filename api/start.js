// @ts-check

import Relay from "github-webhook-relay";

import { Octokit } from "@octokit/core";

import VERSION from "../version.js";

import { getInstallationId } from "./get-installation-id.js";

const GitHubWebHookRelayOctokit = Octokit.defaults({
  userAgent: `gr2m/github-webhook-relay/${VERSION}`,
});

/**
 * Before starting the webhook relay, verify the app credentials and
 * access to the given repository.
 *
 * After that start to listen to the relay's `webhook` event, and in
 * its handler, amend the body with the `installation` key and add
 * the signature to the event. Then inject the event into the passed
 * `app` instance and trigger the `webhook` event.
 *
 * Then start the relay.
 *
 * @param {import("../internal").State} state
 */
export default async function start(state) {
  let appSlug;
  let appEvents;

  try {
    const { data: appInfo } = await state.app.octokit.request("GET /app");
    appSlug = appInfo.slug;
    appEvents = appInfo.events;
  } catch (error) {
    if (error.status === 404) {
      throw Object.assign(new Error(`Invalid app credentials`), {
        name: "GitHubAppWebHookRelayError",
      });
    }

    // @ts-ignore AggregateError is fine for Node 16+
    throw new AggregateError([error], "Could not retrieve app info");
  }

  const installationId = await getInstallationId(state, String(appSlug));

  const octokit = state.octokit
    ? state.octokit
    : new GitHubWebHookRelayOctokit({ auth: state.createHookToken });

  const relay = new Relay({
    owner: state.owner,
    repo: state.repo,
    // @ts-expect-error - appEvents are not typed narrow enough
    events: state.events || appEvents,
    octokit,
  });

  relay.on("error", (error) => state.eventEmitter.emit("error", error));
  relay.on("stop", () => state.eventEmitter.emit("stop"));

  relay.on("webhook", async (event) => {
    const payload = JSON.parse(event.body);
    const newPayload = {
      ...payload,
      installation: {
        id: installationId,
      },
    };
    const newBody = JSON.stringify(newPayload);

    const signature = await state.app.webhooks.sign(newBody);

    const newEvent = {
      ...event,
      body: newBody,
      signature,
    };

    state.eventEmitter.emit("webhook", newEvent);

    await state.app.webhooks.receive({
      id: event.id,
      // @ts-expect-error `event.name` is only typed as string, but webhooks.receive expects a union of known event names
      name: event.name,
      payload: JSON.parse(newEvent.body),
    });
  });

  await relay.start();
  state.eventEmitter.emit("start");
}
