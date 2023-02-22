// @ts-check

/**
 * @param {import("../internal").State} state
 * @param {string} appSlug
 */
export async function getInstallationId(state, appSlug) {
  const [getInstallationRoute, getInstallationParameters, relayTarget] =
    state.repo
      ? [
          "GET /repos/{owner}/{repo}/installation",
          { owner: state.owner, repo: state.repo },
          `${state.owner}/${state.repo}`,
        ]
      : [
          "GET /orgs/{org}/installation",
          {
            org: state.owner,
          },
          state.owner,
        ];

  try {
    const { data: installation } = await state.app.octokit.request(
      getInstallationRoute,
      getInstallationParameters
    );

    return installation.id;
  } catch (error) {
    if (error.status === 404) {
      throw Object.assign(
        new Error(`App ${appSlug} is not installed on ${relayTarget}`),
        {
          name: "GitHubAppWebHookRelayError",
        }
      );
    }

    // @ts-ignore AggregateError is fine for Node 16+
    throw new AggregateError(
      [error],
      `Could not retrieve ${appSlug}'s installation for ${relayTarget}`
    );
  }
}
