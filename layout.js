import {MastoPost} from './mastodon.js';
import {BlueskyPost} from './bluesky.js';
import { Post } from './threads.js';

export async function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    let view = urlParams.get('view');
    if(view==null) {
        view = 'tree';
    }
    if(url) {
        document.querySelector('#controls-url-expanded').style.display = 'none';
        document.querySelector('#controls-url-collapsed').style.display = 'block';
        loadFromURL(url, view);
    }
}

export async function loadFromURL(url, view='indented') {
    let post;
    if(url.includes('bsky.app')) {
        post = await BlueskyPost.fromURL(url);
    } else {
        post = await MastoPost.fromURL(url);
    }
    viewFuncs[view](post);
}

const viewFuncs = {
    'tree': addTreeView,
    'linear': addLinearContextView,
    'linear-condensed': addLinearCondensedContextView,
};

export function addTreeView(post, level=0) {
    document.querySelector('#view_tree').style.display = 'none';
    document.querySelector('#controls-tree').style.display = 'block';
    function subthreadElem(post) {
        if(post.replies.length===0) {
            return post.render();
        }
        const elem = document.createElement('details');
        elem.open = true;
        elem.className = 'subthread-post';
        const summary = document.createElement('summary');
        summary.appendChild(post.render());
        elem.appendChild(summary);
        post.replies.sort((a, b) => a.datetime - b.datetime);
        const subthread = document.createElement('div');
        subthread.className = 'subthread-replies';
        post.replies.forEach(reply => {
            subthread.appendChild(subthreadElem(reply));
        });
        elem.appendChild(subthread);
        return elem;
    }
    document.querySelector('body').appendChild(subthreadElem(post));
}

export function addLinearContextView(post) {
    document.querySelector('#view_linear').style.display = 'none';
    let all_posts = [];
    function addPostAndReplies(basepost) {
        all_posts.push(basepost);
        basepost.replies.forEach(reply => {
            addPostAndReplies(reply);
        });
    }
    addPostAndReplies(post);
    all_posts.sort((a, b) => a.datetime - b.datetime);
    // create a grid layout with 3 columns
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    document.querySelector('body').appendChild(grid);
    const parentHeader = document.createElement('div');
    parentHeader.className = 'grid-header';
    parentHeader.style.gridColumn = "1";
    parentHeader.style.gridRow = "1";
    parentHeader.innerHTML = "Parent";
    const postHeader = document.createElement('div');
    postHeader.className = 'grid-header';
    postHeader.style.gridColumn = "2";
    postHeader.style.gridRow = "1";
    postHeader.innerHTML = "Post";
    const replyHeader = document.createElement('div');
    replyHeader.className = 'grid-header';
    replyHeader.style.gridColumn = "3";
    replyHeader.style.gridRow = "1";
    replyHeader.innerHTML = "First reply";
    grid.appendChild(parentHeader);
    grid.appendChild(postHeader);
    grid.appendChild(replyHeader);
    let i = 1;
    all_posts.forEach(post => {
        i += 1;
        let parentElem;
        if(post.parent===null) {
            parentElem = document.createElement('div');
            parentElem.style.width = '500px';
        } else {
            parentElem = post.parent.render();
        }
        const postElem = post.render();
        parentElem.style.opacity = 0.3;
        parentElem.style.gridColumn = "1";
        parentElem.style.gridRow = `${i}`;
        postElem.style.gridColumn = "2";
        postElem.style.gridRow = `${i}`;
        grid.appendChild(parentElem);
        grid.appendChild(postElem);
        if(post.replies.length>0) {
            post.replies.sort((a, b) => a.datetime - b.datetime);
            const replyElem = post.replies[0].render();
            replyElem.style.opacity = 0.3;
            replyElem.style.gridColumn = "3";
            replyElem.style.gridRow = `${i}`;
            grid.appendChild(replyElem);
        }
    });
}

// New version of lienar context view, use short post format to show parent and replies
export function addLinearCondensedContextView(post) {
    document.querySelector('#view_linear_condensed').style.display = 'none';
    let all_posts = [];
    function addPostAndReplies(basepost) {
        all_posts.push(basepost);
        basepost.replies.forEach(reply => {
            addPostAndReplies(reply);
        });
    }
    addPostAndReplies(post);
    all_posts.sort((a, b) => a.datetime - b.datetime);
    // create a grid layout with 3 columns
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    grid.style.gridTemplateColumns = "260px 520px repeat(auto-fill, 270px)";
    document.querySelector('body').appendChild(grid);
    const parentHeader = document.createElement('div');
    parentHeader.className = 'grid-header';
    parentHeader.style.gridColumn = "1";
    parentHeader.style.gridRow = "1";
    parentHeader.innerHTML = "Parent";
    const postHeader = document.createElement('div');
    postHeader.className = 'grid-header';
    postHeader.style.gridColumn = "2";
    postHeader.style.gridRow = "1";
    postHeader.innerHTML = "Post";
    const replyHeader = document.createElement('div');
    replyHeader.className = 'grid-header';
    replyHeader.style.gridColumn = "3";
    replyHeader.style.gridRow = "1";
    replyHeader.innerHTML = "First replies";
    grid.appendChild(parentHeader);
    grid.appendChild(postHeader);
    grid.appendChild(replyHeader);
    let i = 1;
    function placeElemInGrid(elem, col, row) {
        elem.style.gridColumn = `${col}`;
        elem.style.gridRow = `${row}`;
        grid.appendChild(elem);
    }
    all_posts.forEach(post => {
        i += 1;
        if(post.parent!=null) {
            placeElemInGrid(post.parent.renderShort(), 1, i);
        } else {
            placeElemInGrid(Post.renderShortWithText(''), 1, i);
        }
        placeElemInGrid(post.render(), 2, i);
        if(post.replies.length>0) {
            post.replies.sort((a, b) => a.datetime - b.datetime);
            for(let j=0; j<3 && j<post.replies.length; j++) {
                placeElemInGrid(post.replies[j].renderShort(), 3+j, i);
            }
        }
    });
}

export function reloadWithView(view) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('view', view);
    window.location.search = urlParams.toString();
}

document.querySelector('#view_tree').addEventListener('click', () => reloadWithView('tree'));
document.querySelector('#view_linear').addEventListener('click', () => reloadWithView('linear'));
document.querySelector('#view_linear_condensed').addEventListener('click', () => reloadWithView('linear-condensed'));

document.querySelector('#collapse_all').addEventListener('click', () => {
    document.querySelectorAll('.subthread-post').forEach(elem => elem.open = false);
});
document.querySelector('#expand_all').addEventListener('click', () => { 
    document.querySelectorAll('.subthread-post').forEach(elem => elem.open = true);
});

document.querySelector('#collapse_all_embeds').addEventListener('click', () => {
    document.querySelectorAll('.post-embed').forEach(elem => elem.open = false);
});
document.querySelector('#expand_all_embeds').addEventListener('click', () => {
    document.querySelectorAll('.post-embed').forEach(elem => elem.open = true);
});

function load_url_from_html() {
    const url = document.querySelector('#thread_url').value;
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('url', url);
    window.location.search = urlParams.toString();
}
document.querySelector('#load_thread_from_url').addEventListener('click', load_url_from_html);
document.querySelector('#thread_url').addEventListener('keyup', (event) => {
    if(event.key === 'Enter') {
        load_url_from_html();
    }
});
document.querySelector('#show-url-controls').addEventListener('click', () => {
    document.querySelector('#controls-url-expanded').style.display = 'block';
    document.querySelector('#controls-url-collapsed').style.display = 'none';
});