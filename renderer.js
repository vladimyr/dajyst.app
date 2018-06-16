import fecha from 'fecha';
import html from 'nanohtml';
import raw from 'nanohtml/raw';

const timestampFormat = 'MMMM D [at] H:mm';
const date = timestamp => fecha.format(new Date(timestamp), timestampFormat);

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

export const renderPost = (post, { phone } = {}) => html`
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

export const renderError = (message, { url } = {}) => html`
<div class="error">
  <h2 class="title">Error</h2>
  <span class="message">${ message }</span>
  <a href="${ url }" target="_blank" class="btn">Open on Facebook</a>
</div>
`;
