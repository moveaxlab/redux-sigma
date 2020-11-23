# Contributing

All contributors to `redux-sigma` must follow our [code of conduct](./CODE_OF_CONDUCT.md).

All contributions are welcome:
fixing typo or errors in the documentation or examples,
adding additional examples,
fixing bugs in the codebase,
or integrating new features in the library.

`redux-sigma` has a strong focus on semantics.
If you are developing a new feature or fixing a bug,
open an issue first to describe the bug or to discuss with us the new feature.

We believe that the first step before implementation should be clearing all doubts
about the semantics of the new feature.

## Development

To contribute to `redux-sigma`, start by forking and cloning this repo:

```bash
$ git clone https://github.com/<your-username>/redux-sigma.git
```

`redux-sigma` use `yarn` to manage dependencies.
After cloning the repo, install dependencies by running this command inside its root folder:

```bash
$ yarn
```

After changing some code, you can lint and test it by running this command:

```bash
$ yarn test
```

Testing checks the following things:
- type definitions are consistent across the library, its tests, and the examples
- all code follows our linter rules
- unit tests ensure that no semantic guarantee is broken

All your changes should start from the `master` branch of `redux-sigma`.
When your new feature or bugfix is ready, open a PR towards the `master` branch of this repo.
