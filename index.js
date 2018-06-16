window.Promise = window.Promise || require('pinkie-promise');

import './style.styl';

import $ from 'zepto';
import http from './http';
import Symbol from 'es6-symbol';
import { readPosts } from './scraper';
import { trimLines, reformatText } from './helpers';
import { renderError, renderPost } from './renderer';
import pkg from './package.json';

const ua = `${pkg.name}/${pkg.version}`;
const url = 'https://facebook.com/dajyst/posts';
const phone = '+385957488338';

const Types = {
  Standard: Symbol('standard'),
  ClosedNotice: Symbol('closed-notice'),
  DailyMenu: Symbol('daily-menu')
};

const classes = {
  [Types.Standard]: 'standard',
  [Types.ClosedNotice]: 'closed-notice',
  [Types.DailyMenu]: 'menu'
};

const reMenuHeading = /^Danas u ponudi\s*:?\s*/i;
const reClosedNotice = /ne(?:[čćc]e)?\s+radi/i;
const rePrice = /\s*(\d+)?(?:\s*kn|\.00)\s*/;
const headingSize = 1;

const isClosedNotice = post => reClosedNotice.test(post.content);
const isDailyMenu = post => reMenuHeading.test(post.content);

const isToday = timestamp => (new Date()).getDate() === (new Date(timestamp)).getDate();

const $spinner = $('.spinner');
const $output = $('.output');

fetchPosts(url, 5)
  .then(posts => {
    const [lastPost] = posts;
    const options = { phone, url };

    posts.forEach(post => {
      $(renderPost(post, options))
        .addClass(classes[post.type])
        .toggleClass('today', isToday(post.timestamp))
        .appendTo($output);
    });

    if (posts.length === 0) {
      $output.empty();
      const msg = 'Failed to fetch daily offers from Facebook site.';
      $(renderError(msg, options)).appendTo($output);
    }

    if (lastPost && lastPost.type === Types.ClosedNotice) {
      $(document.documentElement).addClass('closed');
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
    post.type = isClosedNotice(post) ? Types.ClosedNotice : Types.Standard;
    return post;
  }

  const menu = extractMenu(post);
  post.offers = parseMenu(menu);
  post.type = Types.DailyMenu;
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
