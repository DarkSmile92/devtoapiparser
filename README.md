# DEV.to api parser

Supporting the moderation of articles

## enhancements

Planned enhancements to this project:

- Database to safe already checked posts
- Definition of severity for bad words
- Global source for bad words
- More detailed outputs
- GUI (maybe later)

## Setup and usage

Install dependencies with `npm install`.
Modify `index.js` and set up your [DEV.to API Access Token](https://dev.to/settings/account).
Also set your tags in the `MY_TAGS` array, if you want only posts with your tags to be checked (`ONLY_MY_TAGS`) and how many pages (30 articles per page) to check (`SITES_TO_CHECK`).
Then run it with `npm run start`.

![Settings in index.js file](./guide/settings.png)

![Example of output](./guide/output.png)

## Note about the warnings

Not all articles flagged as "need your attention" may be bad / contain unwanted content. For exmaple the phrase `#1` is quite common in good posts but also in bad posts. In the future there will be a severity for each phrase to prevent good posts with those phrases to pop up.
