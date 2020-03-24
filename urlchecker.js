const VERSION = "1.0.2";
const axios = require("axios");
const chalk = require("chalk");
const log = console.log;
const logError = console.error;
const fs = require("fs");

// PERSONAL CONFIG
const APIKEY = "kEmMEzLEFHfMHTAWAtxYiKw8"; // get token from settings
// BASE CONFIG
const BASEURL = "https://dev.to/api";
const BADPHRASES = [
  "Call free/now",
  "Additional income",
  "$$$",
  "Casino",
  "Clearance",
  "Cheap",
  "Credit card",
  "Freedom",
  "Double your",
  "Luxury",
  "Investment",
  "Obligation",
  "Presently",
  "Promotion",
  "Increase sales",
  "Lowest price",
  "credit check",
  "Order now",
  "Refund",
  "Refinance",
  "Rates",
  "supplies",
  "Risk-free",
  "Take action",
  "Bargain",
  "Escort",
  "Hooker",
  "Prostitute",
  "Asshole",
  "Fuck",
  "Abuse",
  "Shop",
  "Needy",
  "Plumber",
  "Sale",
  "Escort",
  "Crypto",
  "Exam"
];
let ADD_BAD_WORDS = [];
// Load additional bad words
fs.readFile("./badstrings.txt", "utf8", function(err, data) {
  if (err) throw err;
  if (data) {
    ADD_BAD_WORDS = [...data.split(",")];
  }
  // console.log(data);
});
let CONSOLE_NEED_SPLIT = false;
const error = chalk.bold.red;
const warning = chalk.keyword("orange");

const printSplit = () => {
  log(chalk.green.bold("---- :: ---- :: ----"));
};

const countWords = s => {
  s = s.replace(/(^\s*)|(\s*$)/gi, ""); //exclude  start and end white-space
  s = s.replace(/[ ]{2,}/gi, " "); //2 or more space to 1
  s = s.replace(/\n /, "\n"); // exclude newline with a start spacing
  return s.split(" ").filter(function(str) {
    return str != "";
  }).length;
  //return s.split(' ').filter(String).length; - this can also be used
};

const countLinks = content => {
  const matches = content.match(/href/gi);
  return matches ? matches.length : 0;
};

const checkURL = async (url, aid) => {
  log(`Checking ${url} with ID ${aid}.`);
  if (aid && aid > 0) {
    const article = await getArticleDetails(aid);
    log("Got item details");
    await checkArticle(article.data);
  }
};

const getArticleDetails = async articleId => {
  try {
    log(`Getting details for ${BASEURL}/articles/${articleId}`);
    return await axios({
      method: "get",
      url: `${BASEURL}/articles/${articleId}`,
      headers: { "Content-Type": "application/json", "api-key": APIKEY }
    });
  } catch (error) {
    // console.error(error);
    logError(error.response.status);
    return null;
  }
};

const checkContentLength = content => {
  const MIN_CHARS = 275;
  if (!content || content.length <= MIN_CHARS) {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    log(
      warning(
        `Article content too short: ${
          content ? content.length : 0
        } of required ${MIN_CHARS} chars. Should be checked.`
      )
    );
    return true;
  }
  return false;
};

const checkLinkWordRatio = content => {
  const MAX_LINK_PCT = 20;
  const numWords = countWords(content);
  const numLinks = countLinks(content);

  const linkToWordRatio = (numLinks * 100) / numWords;

  if (linkToWordRatio >= MAX_LINK_PCT) {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    log(
      warning(
        `Link to word ratio too high: ${linkToWordRatio}/${MAX_LINK_PCT}. Words: ${numWords} Links: ${numLinks}`
      )
    );
    return true;
  }
  return false;
};

const checkBadWords = content => {
  const lwrContent = content.toLowerCase();
  let foundWords = [];
  for (const badword of BADPHRASES) {
    if (badword.length > 0 && lwrContent.indexOf(badword.toLowerCase()) >= 0) {
      // console.log(`BW: ${badword}`);
      foundWords.push(badword);
    }
  }
  for (const badword of ADD_BAD_WORDS) {
    if (badword.length > 0 && lwrContent.indexOf(badword.toLowerCase()) >= 0) {
      // console.log(`BW: ${badword}`);
      foundWords.push(badword);
    }
  }
  if (foundWords && foundWords.length > 0) {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    log(warning(`Found the following bad words: ${foundWords.join(", ")}`));
    return true;
  }
  return false;
};

const checkStrangeTags = taglist => {
  const CHAR_THRESHOLD = 17;
  let foundStrangeTags = false;

  for (const tag of taglist) {
    if (tag.trim().length >= CHAR_THRESHOLD || tag.trim().indexOf(" ") >= 0) {
      log(warning(`The Tag ${tag.trim()} looks strange, please check it.`));
      foundStrangeTags = true;
    }
  }
  return foundStrangeTags;
};

const processChecks = async articleItem => {
  const articleDetails = await getArticleDetails(articleItem.id);
  if (!articleDetails) return false;
  const details = articleDetails.data;
  let mustCheck = false;

  if (details.body_html) {
    if (checkContentLength(details.body_html)) {
      mustCheck = true;
    }
    if (checkLinkWordRatio(details.body_html)) {
      mustCheck = true;
    }
    if (checkBadWords(details.body_html)) {
      mustCheck = true;
    }
    if (checkStrangeTags(details.tag_list.split(","))) {
      mustCheck = true;
    }
  } else {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    log(error(`Could not get content of article ${articleItem.id}`));
  }
  return mustCheck;
};

const checkArticle = async article => {
  const article_id = article.id;
  const article_title = article.title;
  const article_description = article.description;
  const article_published_at = article.published_at;
  const article_tags = article.tag_list; // ['career', 'productivity']
  const article_slug = article.slug;
  const article_path = article.path;
  const article_url = article.url;
  const article_canonical_url = article.canonical_url;
  const article_comments_count = article.comments_count;
  const article_reactions_count = article.positive_reactions_count;
  const article_published_timestamp = article.published_timestamp;
  const article_user = article.user; // { name, username, twitter_username, github_username, website_url, profile_image, profile_image_90 }

  CONSOLE_NEED_SPLIT = true;

  const needAttention = await processChecks(article);
  if (needAttention) {
    log(
      `Post (${article_id}) "${article_title}" from "${article_user.name}" (${article_user.username})`
    );
    log(article_url);
  }
};

log(chalk.reset.cyan.bold(`DEV.to Moderator v${VERSION}`));

if (!APIKEY || APIKEY.length === 0 || APIKEY === "") {
  log(error("No APIKEY configured! Please provide one in the file!"));
} else {
  const argv = require("minimist")(process.argv.slice(2));
  //console.dir(argv);
  if (argv.url && argv.aid) {
    checkURL(argv.url, argv.aid);
  } else {
    log(
      chalk.reset.green.bold(
        `Usage: node urlchecker.js --url="https://dev.to/how-to-use-api" --aid=21651`
      )
    );
  }
}
