'use strict';

window.Promise = window.Promise || require('pinkie-promise');

require('./style.styl');

const $ = require('zepto');
require('zepto/src/stack.js');
const fetch = require('whatwg-fetch');
const urlJoin = require('url-join');
const fecha = require('fecha');
const { readPosts } = require('./scraper');

const proxy = 'https://cors.now.sh/';

const url = 'https://facebook.com/dajyst/posts';
const phone = '+385957488338';

const isDailyMenu = post => (/^Danas u ponudi\s*:/i).test(post.content);

const timestampFormat = 'MMMM D [at] H:mm';
const date = timestamp => fecha.format(new Date(timestamp), timestampFormat);
const isToday = timestamp => (new Date()).getDate() === (new Date(timestamp)).getDate();

const getClass = post =>
  `post ${ post.type }${ isToday(post.timestamp) ? ' today' : '' }`;

const template = (str='') => str.trim();

const renderMenu = offers => template(`
  <ul class="menu">
  ${ offers.map(({ name, price }) => `
    <li class="offer">
      <span class="name">${ name }</span>
      <span class="price">${ price }kn</span>
    </li>`).join('\n')
  }
  </ul>`);

const renderPost = post => template(`
  <div class="${ getClass(post) }">
    <span class="timestamp"><i class="icon-clock"></i> ${ date(post.timestamp) }</span>
    <div class="content">${ post.offers ? renderMenu(post.offers) : post.content }</div>
    <a class="btn" href=${ post.url } target="_blank">Open on Facebook</a>
    <a class="btn btn-phone" href="tel:${ phone }" target="_blank"><i class="icon-phone"></i> Order</a>
  </div>`);

let $spinner = $('.spinner');
let $output = $('.output');

fetchPosts(url, 5)
  .then(posts => {
    let html = posts.map(post => renderPost(post)).join('\n');
    $output.html(html).show();
    $spinner.hide();
  });

function fetchPosts(fbUrl, limit) {
  let url = urlJoin(proxy, fbUrl);
  return fetch(url)
    .then(resp => resp.json())
    .then(body => $(`${ body }</body></html>`))
    .then($html => readPosts($, $html, limit))
    .then(posts => posts.map(post => parsePost(post)));
}

function parsePost(post) {
  if (!isDailyMenu(post)) {
    post.type = 'standard';
    return post;
  }

  let lines = post.content.split('\n').slice(1);
  post.type = 'menu';
  post.offers = lines.map(line => {
    let [ name, price ] = line.trim().split(/\s*(\d+)?(?:kn)$/);
    return { name, price };
  });
  return post;
}
