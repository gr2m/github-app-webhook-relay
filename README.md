# `github-app-webhook-relay`

> Receive webhooks from a GitHub repository using websockets amended with an `installation: { id }` key to run GitHub Apps locally.
>
> **Warning**  
> Receiving webhooks via websockets is currently in [private beta](https://github.blog/changelog/2022-11-16-webhook-forwarding-in-the-github-cli-public-beta/)

`github-app-webhook-relay` is built on top of `github-webhook-relay`. The difference is that `github-app-webhook-relay` will amend every received github webhook request's body with the `installation` key and set it to `{ id }` where `id` is the installation id of the installation ID for the given repository. Without the `installation` key the webhook event payload you cannot test GitHub Apps locally as the installation ID is required to create an installation access token in order to act as the app in a repository. Also `events` are optional and are set to the app's subscribed events by default.

## Usage

The `createHookToken` option needs to be set to a [token with the `admin:repo_hook` and/or `admin:org_hook` scope](https://github.com/settings/tokens/new?scopes=admin:repo_hook,admin:org_hook&description=github-webhook-relay), depending on which you want to create.

Webhooks are injected into the passed `app` instance automatically and can be handled using `app.webhooks.on(eventName, handler)`

```js
import { App } from "octokit";
import AppWebhookRelay from "github-app-webhook-relay";

const app = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.APP_PRIVATE_KEY,
  webhooks: {
    secret: process.env.APP_WEBHOOK_SECRET,
  },
});

app.webhooks.on("issues", async ({ payload, octokit }) => {
  const { data: comment } = await octokit.request(
    "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
    {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: "Hello, world!",
    }
  );

  app.log.info("[app] Comment created: %s", comment.html_url);
});

const relay = new AppWebhookRelay({
  owner: "gr2m",
  repo: "github-webhooks-relay",
  createHookToken: process.env.GITHUB_TOKEN,
  app,
});

relay.on("error", (error) => {
  console.log("error: %s", error);
});

relay.start();
```

## API

### Constructor

```js
const relay = new WebhookRelay(options);
```

<table>
  <thead align=left>
    <tr>
      <th>
        name
      </th>
      <th>
        type
      </th>
      <th width=100%>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.owner</code>
      </th>
      <td>
        <code>string</code>
      </td>
      <td>

**Required**. The account name of the GitHub user or organization.

</td>
    </tr>
    <tr>
      <th>
        <code>options.repo</code>
      </th>
      <td>
        <code>string</code>
      </td>
      <td>

When set, the webhook will be created for the repository. When not set, the webhook will be created for the organization. Note that user-level webhooks are not supported by GitHub, so `options.owner` must be an organization.

</td>
    </tr>
    <tr>
      <th>
        <code>options.app</code>
      </th>
      <td>
        <code>app</code>
      </td>
      <td>

**Required**. `app` is an instance of [`@octokit/app`](https://github.com/octokit/app.js/#readme) or [`octokit`'s `App` constructor](https://github.com/octokit/octokit.js/#octokit-api-client)

</td>
    </tr>
    <tr>
      <th>
        <code>options.createHookToken</code>
      </th>
      <td>
        <code>string</code>
      </td>
      <td>

**Required unless `options.octokit` is set**. Access token to create the repository webhook. The token needs to have the `admin:repo_hook` scope. ([create a personal access token](https://github.com/settings/tokens/new?scopes=admin:repo_hook&description=github-webhook-relay)).

</td>
    </tr>
    <tr>
      <th>
        <code>options.octokit</code>
      </th>
      <td>
        <code>octokit</code>
      </td>
      <td>

**Required unless `options.createHookToken` is set**. `octokit` is an instance of [`@octokit/core`](https://github.com/octokit/core.js/#readme) or a compatible constructor such as [`octokit`'s `Octokit`](https://github.com/octokit/octokit.js#octokit-api-client).

</td>
    </tr>
    <tr>
      <th>
        <code>options.events</code>
      </th>
      <td>
        <code>string[]</code>
      </td>
      <td>

The list of events that the webhook should subscribe to. For a list of supported event names, see [the GitHub docs](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads).

Defaults to the app's subscribed events.

</td>
    </tr>
  </tbody>
</table>

### `relay.on()`

```js
relay.on(eventName, callback);
```

<table>
  <thead align=left>
    <tr>
      <th>
        name
      </th>
      <th>
        type
      </th>
      <th width=100%>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>eventName</code>
      </th>
      <td>
        <code>string</code>
      </td>
      <td>

**Required**. Supported events are

1. `webhook` - emitted when a webhook is received
1. `start` - emitted when the relay is started
1. `stop` - emitted when the relay is stopped
1. `error` - emitted when an error occurs

</td>
    </tr>
    <tr>
      <th>
        <code>callback</code>
      </th>
      <td>
        <code>function</code>
      </td>
      <td>

**Required**. The event handler.

When `eventName` is `webhook`, the callback is called with an object with the following properties:

- `id` - the webhook delivery GUID
- `name` - the name of the event
- `body` - the webhook payload as string<sup>†</sup>
- `signature` - the signature of the webhook payload<sup>††</sup>
- `headers` - the headers of the webhook request

No arguments are passed when `eventName` is set to `start` or `stop`.

When `eventName` is `error`, the callback is called with an error object.

<sub>†The webhook payload is passed as string in case the signature needs to be verified. Parsing the JSON and later stringifying it again bight result in a signature mismatch.</sub>

<sub>††The signature is calculated based on the amended payload with the additional `installation` key</sub>

</td>
    </tr>
  </tbody>
</table>

### `relay.start()`

```js
relay.start();
```

Creates the repository hook and connects to the GitHub webhook forwarding service.

### `relay.stop()`

```js
relay.start();
```

Disconnects from the GitHub webhook forwarding service and deletes the repository hook.

## How it works

See [how `github-webhooks-relay` works](https://github.com/gr2m/github-webhook-relay/#how-it-works).

`github-app-webhook-relay` listenes to the `webhook` event of its internal `github-webhooks-relay` instance, parses the payload, adds the installation key, calculates the signature based on the new body, and then triggers its own `webhook` event.

`github-app-webhook-relay` also verifies that the given app has access to the given repository and is subscribed to the given events.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## See also

- [`github-webhook-relay`](https://github.com/gr2m/github-webhook-relay/#readme) - The webhook relay this libary is built upon

## License

[ISC](LICENSE)
