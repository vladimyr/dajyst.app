import $ from 'zepto';
import urlJoin from 'url-join';

const selectors = [
  '.fbUserContent', // primary
  '.userContentWrapper',
  '.fbUserPost',
  '.fbUserStory',
  '[role=article]'  // fallback
];

const getText = $el => $el.text().replace(/\n\s*/g, '\n').trim();

export function readPosts($html, limit = 10) {
  const $articles = find($html, selectors).slice(0, limit);
  let posts = [];
  $articles.each((_, el) => {
    const $el = $(el);
    const content = getContent($el);
    if (!content) return;
    const { url, timestamp } = getMetadata($el);
    posts.push({ content, url, timestamp });
  });
  return posts;
}

function find(parent, selectors = []) {
  const $parent = $(parent);
  let $elements = $();

  let i = 0;
  const len = selectors.length;
  while (i < len) {
    $elements = $parent.find(selectors[i]);
    if ($elements.length > 0) return $elements;
    i += 1;
  }

  return $elements;
}

function getContent($article) {
  const $content = $article.find('.userContent p');
  const chunks = $content.map((_, el) => {
    const $chunk = $(el);
    // remove all hidden parts
    $chunk.find('.text_exposed_hide').remove();
    // replace all <br>-s with line feeds
    $chunk.find('br').replaceWith('\n');
    return getText($chunk);
  }).get();
  return chunks.join('\n');
}

function getMetadata($article) {
  const $abbr = $article.find('abbr');
  const $a = $abbr.parent();

  const url = urlJoin('https://facebook.com/', $a.attr('href'));
  const timestamp = $abbr.attr('data-utime') * 1000;

  return { url, timestamp };
}
