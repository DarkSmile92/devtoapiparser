const axios = require("axios");
const fs = require("fs");

// PERSONAL CONFIG
const APIKEY = ""; // get token from settings
const MY_TAGS = ["productivity"];
const ONLY_MY_TAGS = true;
const SITES_TO_CHECK = 2;

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
  "Needy"
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

const printSplit = () => {
  console.log("---- :: ---- :: ----");
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

const getArticlesPaged = async page => {
  try {
    return await axios({
      method: "get",
      url: `${BASEURL}/articles?page=${page}`,
      headers: { "Content-Type": "application/json", "api-key": APIKEY }
    });
  } catch (error) {
    console.error(error);
  }
};

const checkMyArticles = async pagesToCheck => {
  for (let page = 0; page < pagesToCheck; page++) {
    const articles = await getArticlesPaged(page + 1);

    if (articles.data) {
      console.log(
        `Got ${Object.entries(articles.data).length} articles at page ${page +
          1}`
      );
      // loop articles and check them
      for (const article of articles.data) {
        await checkArticle(article);
      }
    }
  }
};

const getArticleDetails = async articleId => {
  try {
    return await axios({
      method: "get",
      url: `${BASEURL}/articles/${articleId}`,
      headers: { "Content-Type": "application/json", "api-key": APIKEY }
    });
  } catch (error) {
    // console.error(error);
    console.error(error.response.status);
    return null;
  }
};

const checkContentLength = content => {
  const MIN_CHARS = 40;
  if (!content || content.length <= MIN_CHARS) {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    console.log(
      `Article content too short: ${
        content ? content.length : 0
      } of required ${MIN_CHARS} chars.`
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
    console.log(
      `Link to word ratio too high: ${linkToWordRatio}/${MAX_LINK_PCT}. Words: ${numWords} Links: ${numLinks}`
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
    console.log(`Found the following bad words: ${foundWords.join(", ")}`);
    return true;
  }
  return false;
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
  } else {
    if (CONSOLE_NEED_SPLIT) {
      printSplit();
      CONSOLE_NEED_SPLIT = false;
    }
    console.log(`Could not get content of article ${articleItem.id}`);
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

  if (ONLY_MY_TAGS) {
    // check if my tag is affected
    for (const tagname of MY_TAGS) {
      if (article_tags.indexOf(tagname) >= 0) {
        const needAttention = await processChecks(article);
        if (needAttention) {
          console.log(
            `Post (${article_id}) "${article_title}" from "${
              article_user.name
            }" (${
              article_user.username
            }) needs moderation from you due to the tag #${tagname}`
          );
          console.log(article_url);
        }
      }
    }
  } else {
    const needAttention = await processChecks(article);
    if (needAttention) {
      console.log(
        `Post (${article_id}) "${article_title}" from "${article_user.name}" (${
          article_user.username
        })`
      );
      console.log(article_url);
    }
  }
};

if (!APIKEY || APIKEY.length === 0 || APIKEY === "") {
	console.error("No APIKEY configured! Please provide one in the file!");
} else {
	checkMyArticles(SITES_TO_CHECK);	
}
