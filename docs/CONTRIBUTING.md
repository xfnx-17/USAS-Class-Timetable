# Contributing to USAS Class Timetable

First off, thank you for considering contributing to the **USAS Class Timetable** project! It is contributions from students, developers, and the USAS STEM Club that make this portal a great tool for the entire USAS community.

---

## Where do I go from here?

If you have noticed a bug, UI glitch, or have a feature request, make sure to check if there is already an issue open for it. If not, go ahead and open one!

---

## Fork & create a branch

If this is something you think you can fix, then fork the repository and create a branch with a descriptive name.

A good branch name would be (where issue #42 is the ticket you are working on):

```sh
git checkout -b 42-add-warm-theme
```

---

## Get the test suite running

Make sure to install dependencies and run the tests before making your changes:

```sh
npm install
npm run typecheck
npm run test:unit
```

---

## Implement your fix or feature

At this point, you are ready to make your changes:
* Maintain clean TypeScript types and avoid `any` where possible.
* Ensure responsive layouts render cleanly across mobile and desktop viewports.
* Add unit test coverage in `tests/` for any new utility logic.

---

## Make a Pull Request

At this point, switch back to your `main` branch and make sure it is up to date:

```sh
git checkout main
git pull origin main
```

Then update your feature branch from your local copy of `main`, and push it:

```sh
git checkout 42-add-warm-theme
git rebase main
git push --set-upstream origin 42-add-warm-theme
```

Finally, go to GitHub and create a Pull Request.

---

## Code formatting

Please ensure your code passes ESLint and TypeScript checks:
```sh
npm run test:strict
```
