window.Promise = window.Promise || require('pinkie-promise');

import './style.styl';

import $ from 'zepto';
import html from 'nanohtml';
import raw from 'nanohtml/raw';
import fecha from 'fecha';
import http from './http';
import { readPosts } from './scraper';
import { trimLines, reformatText } from './helpers';
import pkg from './package.json';

const ua = `${pkg.name}/${pkg.version}`;
const url = 'https://facebook.com/dajyst/posts';
const phone = '+385957488338';

const reMenuHeading = /^Danas u ponudi\s*:?\s*/i;
const reClosedNotice = /ne(?:[čćc]e)?\s+radi/i;
const rePrice = /\s*(\d+)?(?:\s*kn|\.00)\s*/;
const headingSize = 1;

const isClosedNotice = post => reClosedNotice.test(post.content);
const isDailyMenu = post => reMenuHeading.test(post.content);

const timestampFormat = 'MMMM D [at] H:mm';
const date = timestamp => fecha.format(new Date(timestamp), timestampFormat);
const isToday = timestamp => (new Date()).getDate() === (new Date(timestamp)).getDate();

const renderText = content => {
  const text = content.replace(/(?:\n)/g, '<br/>').trim();
  return html`<p class="raw">${ raw(text) }</p>`;
};

const renderMenu = offers => html`
<ul class="menu">
${ offers.map(({ name, price }) => html`
  <li class="offer">
    <span class="name">${ name }</span>
    <span class="price price-${ price }">${ price }kn</span>
  </li>
`)}
</ul>
`;

const renderPost = post => html`
<div class="post">
  <span class="timestamp">
    <i class="icon material-icons">access_time</i> ${ date(post.timestamp) }
  </span>
  <div class="content">
  ${ post.offers ? renderMenu(post.offers) : renderText(post.content) }
  </div>
  <a href="${ post.url }" target="_blank" class="btn">Open on Facebook</a>
  <a href="tel:${ phone }" target="_blank" class="btn btn-phone">
    <i class="icon material-icons">call</i> Order
  </a>
</div>
`;

const renderError = message => html`
<div class="error">
  <h2 class="title">Error</h2>
  <span class="message">${ message }</span>
  <a href="${ url }" target="_blank" class="btn">Open on Facebook</a>
</div>
`;

const $spinner = $('.spinner');
const $output = $('.output');

fetchPosts(url, 5)
  .then(posts => {
    posts.forEach(post =>
      $(renderPost(post))
        .addClass(post.type)
        .toggleClass('today', isToday(post.timestamp))
        .appendTo($output));

    if (posts.length === 0) {
      $output.empty();
      $(renderError('Failed to fetch daily offers from Facebook site.'))
        .appendTo($output);
    }

    if (posts[0].type === 'closed-notice') {
      $('html').addClass('closed');
    }

    $output.show();
    $spinner.hide();
  });

function fetchPosts(fbUrl, limit) {
  return http(url, { headers: { 'User-Agent': ua } })
    .then(body => $(`${ body }</body></html>`))
    .then($html => readPosts($html, limit))
    .then(posts => posts.map(post => parsePost(post)));
}

function parsePost(post) {
  if (!isDailyMenu(post)) {
    post.type = isClosedNotice(post) ? 'closed-notice' : 'standard';
    return post;
  }

  const menu = extractMenu(post);
  post.offers = parseMenu(menu);
  post.type = 'menu';
  return post;
}

function extractMenu(post) {
  return trimLines(post.content, headingSize);
}

function parseMenu(menu) {
  let offers = [];
  const tokens = menu.split(rePrice);

  let i = 0;
  const len = tokens.length - 1;
  while (i < len) {
    offers.push({
      name: reformatText(tokens[i]),
      price: parseInt(tokens[i + 1], 10)
    });
    i += 2;
  }

  return offers;
}
