// @ts-check

/**
 * Host-provided singletons — never bundled into the remote. Anything not in
 * this map is bundled normally so the remote stays self-contained.
 *
 * `import: false` marks erxes-ui / ui-modules: package.json installs only
 * their type declarations (@erxes/ui, @erxes/ui-modules); the remote always
 * consumes the host core-ui copy at runtime.
 *
 * This set MUST match the core-ui shared() list or the remote ships a second
 * copy of React/Apollo and breaks the host context.
 */
const hostShared = { singleton: true, requiredVersion: false };

const hostOnly = { ...hostShared, import: false };

/** @type {import('@module-federation/sdk').moduleFederationPlugin.ModuleFederationPluginOptions} */
const config = {
  name: 'erxes_agent_ui',
  filename: 'remoteEntry.js',
  exposes: {
    './config': './src/config.tsx',
    // Expose keys loaded by the host via `${plugin.name}_ui` must use the
    // underscored remote name (see config.tsx `name`).
    './erxes_agent': './src/modules/ErxesAgentMain.tsx',
    // The host's settings router resolves `${CONFIG.name}_ui/erxes_agentSettings`
    // and mounts it under `/settings/erxes-agent/*`.
    './erxes_agentSettings': './src/modules/ErxesAgentSettings.tsx',
    './floatingWidget': './src/widgets/FloatingWidget.tsx',
  },
  shared: {
    react: hostShared,
    'react-dom': hostShared,
    'react-router': hostShared,
    'react-router-dom': hostShared,
    '@apollo/client': hostShared,
    jotai: hostShared,
    'react-i18next': hostShared,
    'erxes-ui': hostOnly,
    'ui-modules': hostOnly,
  },
};

export default config;
