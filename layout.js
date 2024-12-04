import {MastoPost} from './mastodon.js';
import {BlueskyPost} from './bluesky.js';
import { htmlToNode, Post } from './threads.js';

export async function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    let view = urlParams.get('view');
    if(view==null) {
        view = 'tree';
    }
    let sortorder = urlParams.get('sort');
    if(sortorder==null) {
        sortorder = 'date-asc';
    }
    if(sortorder=='date-asc') {
        document.querySelector('#sort-by-date').innerHTML = 'Date ↑';
    } else {
        document.querySelector('#sort-by-date').innerHTML = 'Date ↓';
    }
    if(sortorder=='engagement-desc') {
        document.querySelector('#sort-by-engagement').innerHTML = 'Engagement ↑';
    } else {
        document.querySelector('#sort-by-engagement').innerHTML = 'Engagement ↓';
    }
    const options = {sortorder: sortorder};
    // set bookmarklet
    urlParams.delete('url');
    const bookmarklet_code = "javascript:(() => {const url = encodeURIComponent(window.location.href); window.open(`https://thesamovar.github.io/thread-navigator/index.html?url=${url}&"+urlParams.toString()+"`, '_blank');})()";
    document.querySelector('#created-bookmarklet-code').innerHTML = bookmarklet_code;
    document.querySelector('#created-bookmarklet-link').href = bookmarklet_code;
    // and load it
    if(url) {
        document.querySelector('#controls-url-expanded').style.display = 'none';
        document.querySelector('#controls-url-collapsed').style.display = 'block';
        loadFromURL(url, view, options);
    }
}

export async function loadFromURL(url, view, options) {
    document.querySelector('#thread-loading').style.display = 'block';
    let post;
    if(url.includes('bsky.app')) {
        post = await BlueskyPost.fromURL(url);
    } else {
        post = await MastoPost.fromURL(url);
    }
    viewFuncs[view](post, options);
    document.querySelector('#thread-loading').style.display = 'none';
    document.querySelector('#documentation-tab').open = false;
}

const viewFuncs = {
    'tree': addTreeView,
    'linear': addLinearContextView,
    'linear-condensed': addLinearCondensedContextView,
};

function sortfunc(options) {
    if(options.sortorder=='date-desc') {
        return (a, b) => b.datetime - a.datetime;
    } else if(options.sortorder=='date-asc') {
        return (a, b) => a.datetime - b.datetime;
    } else if(options.sortorder=='engagement-desc') {
        return (a, b) => b.engagement - a.engagement;
    } else if(options.sortorder=='engagement-asc') {
        return (a, b) => a.engagement - b.engagement;
    } else {
        return (a, b) => b.datetime - a.datetime; // default
    }
}

export function addTreeView(post, options, level=0) {
    document.querySelector('#view_tree').style.display = 'none';
    document.querySelector('#controls-tree').style.display = 'block';
    function subthreadElem(post) {
        if(post.replies.length===0) {
            return post.render();
        }
        const elem = document.createElement('div');
        // elem.open = true;
        elem.className = 'subthread-post';
        const summary = document.createElement('div');
        const postElem = post.render();
        const toggleElem = htmlToNode('<div class="tree-post-toggle">▼</div>');
        postElem.querySelector('.post-left').appendChild(toggleElem);
        summary.appendChild(postElem);
        elem.appendChild(summary);
        post.replies.sort(sortfunc(options));
        const subthread = document.createElement('div');
        subthread.className = 'subthread-replies';
        post.replies.forEach(reply => {
            subthread.appendChild(subthreadElem(reply));
        });
        elem.appendChild(subthread);
        toggleElem.addEventListener('click', () => {
            console.log('here');
            const isOpen = subthread.checkVisibility();
            if(isOpen) {
                toggleElem.innerHTML = '▶';
                subthread.style.display = 'none';
            } else {
                toggleElem.innerHTML = '▼';
                subthread.style.display = 'block';
            }
        });
        return elem;
    }
    document.querySelector('#thread-view').replaceChildren(subthreadElem(post));
}

export function addLinearContextView(post, options) {
    document.querySelector('#view_linear').style.display = 'none';
    let all_posts = [];
    function addPostAndReplies(basepost) {
        all_posts.push(basepost);
        basepost.replies.forEach(reply => {
            addPostAndReplies(reply);
        });
    }
    addPostAndReplies(post);
    all_posts.sort(sortfunc(options));
    // create a grid layout with 3 columns
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    document.querySelector('#thread-view').replaceChildren(grid);
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
            post.replies.sort(sortfunc(options));
            const replyElem = post.replies[0].render();
            replyElem.style.opacity = 0.3;
            replyElem.style.gridColumn = "3";
            replyElem.style.gridRow = `${i}`;
            grid.appendChild(replyElem);
        }
    });
}

// New version of lienar context view, use short post format to show parent and replies
export function addLinearCondensedContextView(post, options) {
    document.querySelector('#view_linear_condensed').style.display = 'none';
    let all_posts = [];
    function addPostAndReplies(basepost) {
        all_posts.push(basepost);
        basepost.replies.forEach(reply => {
            addPostAndReplies(reply);
        });
    }
    addPostAndReplies(post);
    all_posts.sort(sortfunc(options));
    // create a grid layout with 3 columns
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    grid.style.gridTemplateColumns = "260px 520px repeat(auto-fill, 270px)";
    document.querySelector('#thread-view').replaceChildren(grid);
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
            post.replies.sort(sortfunc(options));
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
    document.querySelectorAll('.subthread-replies').forEach(elem => elem.style.display = 'none');
    document.querySelectorAll('.tree-post-toggle').forEach(elem => elem.innerHTML = '▶');
});
document.querySelector('#expand_all').addEventListener('click', () => { 
    document.querySelectorAll('.subthread-replies').forEach(elem => elem.style.display = 'block');
    document.querySelectorAll('.tree-post-toggle').forEach(elem => elem.innerHTML = '▼');
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

document.querySelector('#sort-by-date').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sortorder = urlParams.get('sort');
    if(sortorder=='date-asc') {
        urlParams.set('sort', 'date-desc');
    } else {
        urlParams.set('sort', 'date-asc');
    }
    window.location.search = urlParams.toString();
});

document.querySelector('#sort-by-engagement').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sortorder = urlParams.get('sort');
    if(sortorder=='engagement-desc') {
        urlParams.set('sort', 'engagement-asc');
    } else {
        urlParams.set('sort', 'engagement-desc');
    }
    window.location.search = urlParams.toString();
});