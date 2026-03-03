// Migrations are an early feature. Currently, they're nothing more than this
// temporary script that wraps the deploy command. In the future, migrations
// will be built into the CLI and the deploy command will be removed.
const anchor = require('@coral-xyz/anchor')

module.exports = async function (provider: any) {
  anchor.setProvider(provider)
}
