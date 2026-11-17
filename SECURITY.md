# Security Policy

## Supported versions

This repository builds the OVHcloud documentation site
([docs.ovhcloud.com](https://docs.ovhcloud.com)). There are no maintained
releases: fixes are merged into the `develop` branch, which is then merged
into `master` and deployed to the live site. Only the live site and the
current state of these two branches receive security fixes.

| Version | Supported |
|---|---|
| live site (`master` branch) | yes |
| `develop` branch | yes |
| older releases and tags | no |

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues,
discussions or pull requests.

Report them privately through GitHub:
[Report a vulnerability](https://github.com/ovh/ovhcloud-docs/security/advisories/new).

Please include:

- the affected page URL, or the file and commit in this repository
- the affected component (site theme, MDX component, build script, ...)
- steps to reproduce
- the impact you observed or expect

## What to expect

- We acknowledge your report.
- We keep you informed of the progress towards a fix.
- Once a fix is deployed, we publish a GitHub security advisory and credit
  you, unless you prefer to stay anonymous.

## Scope

In scope: the code in this repository (site theme, components, plugins,
build scripts) and the documentation site it produces.

Out of scope:

- vulnerabilities in OVHcloud products and services themselves, including the
  ones the guides describe. Report these to the OVHcloud CSIRT
  (csirt@ovhcloud.com) or through the
  [OVHcloud bug bounty program](https://yeswehack.com/programs/ovh).
- inaccurate or outdated instructions in a guide that have no security
  impact. Open an issue with the "Outdated information" template instead.
