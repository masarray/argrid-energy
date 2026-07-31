/** Cloudflare Worker adapter for the static Vite application. */
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
