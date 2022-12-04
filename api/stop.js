// @ts-check

/**
 * @param {import("../internal").State} state
 */
export default async function stop(state) {
  if (state.relay) {
    await state.relay.stop();
  }

  state.eventEmitter.emit("stop");
}
