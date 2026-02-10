WebSockHop Changelog
====================

  * Release to npmjs using updated CI workflow and trusted publishing

v. 2.2.2 (02-17-2025)

  * Clean up build scripts
  * Release to npmjs using CI workflow
  * Fix gitignore
  * Fix echo example

v. 2.2.1 (09-16-2017)

  * _raiseErrorEvent clears socket fully including removing listeners and relevant private state, not just setting this.socket to null
  * use exorcist to build source map file
  * Use mkdirp from npm instead of 'mkdir -p' in npm build scripts. Should help with Windows support

v. 2.2.0 (10-20-2016)

  * Unified logging (#18)

v. 2.1.0 (10-03-2016)

  * Moved WebSocket availability check into createSocket (#12)
  * Added support for polyfills in echo example (#13)

v. 2.0.0 (05-27-2016)

  * API changed, now protocols is a member of opts.
  * Release to NPM.

v. 1.1.0 (05-20-2016)

  * Code updated to ES2015, modularized.
  * Added support for custom WebSocket create function.
  * Removed code to disable Esc on Firefox. No longer needed.

v. 1.0.2 (04-03-2016)

  * Added check to disqualify old browsers that don't expose WebSocket object.

v. 1.0.1 (10-23-2014)

  * Fix crash when script is included in <head> section of html.

v. 1.0.0 (10-16-2014)

  * Stable version.

v. 0.1.0 (06-01-2014)

  * Initial Release.
