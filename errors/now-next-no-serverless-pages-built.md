# No serverless pages were built

#### Why This Error Occurred

Next.js has a multiple build `target`s. In this case we the builder tried to execute `now-build` in `package.json`'s `"scripts"` but there was no build for the serverless target.

#### Possible Ways to Fix It

Make sure `now-build` is part of `scripts` in `package.json`:

```json
{
  "scripts": {
    "now-build": "next build"
  }
}
```

Then ensure `target: 'serverless'` is set in `next.config.js`:

```js
module.exports = {
  target: 'serverless'
}
```

At this point in time the `serverless` build target is only available on the latest release of the `canary` release channel of Next.js.
Meaning you will have to install the `canary` version of Next.js:

```
npm install --save next@canary
```

Or using `yarn`:

```
yarn add next@canary
```

### Useful Links

- [Build targets](https://github.com/zeit/next.js/pull/5927)
