/* Site configuration. Edit this file per deployment; no build step needed.
   See docs/DEPLOY.md. */
window.SPRINGST_CONFIG = {
  /* URL of the AI proxy (worker/), e.g. "https://springst-ai.example.workers.dev/chat".
     Empty string = AI chat is hidden on the public site.
     Inside a claude.ai artifact the chat uses the viewer's own Claude account instead. */
  aiEndpoint: "",

  /* Electoral authorisation statement shown in the footer of every page.
     Victorian law requires published electoral material to state who authorised it.
     REQUIRED before a public launch. See docs/DEPLOY.md#authorisation.
     Example shape: "Authorised by <Full Name>, <street address>, <suburb> VIC <postcode>." */
  authorisation: "",

  /* Shown in the footer. Point it at the public repository so people can report errors. */
  repoUrl: "https://github.com/satojandro/springst"
};
