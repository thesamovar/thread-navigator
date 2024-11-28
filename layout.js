import {MastoPost} from './mastodon.js';
import {BlueskyPost} from './bluesky.js';

export async function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    let view = urlParams.get('view');
    if(view==null) {
        view = 'tree';
    }
    if(url) {
        // document.querySelector('#mastodon_url').value = url;
        // mastoview_load_and_render(url, view);
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
};

export function addTreeView(post, level=0) {
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
    // const postElem = post.render();
    // postElem.style.marginLeft = `${level*40}px`;
    // document.querySelector('body').appendChild(postElem);
    // post.replies.sort((a, b) => a.datetime - b.datetime);
    // post.replies.forEach(reply => {
    //     addTreeView(reply, level+1);
    // });
}

export function addLinearContextView(post) {
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

export function reloadWithView(view) {
    const urlParams = new URLSearchParams(window.location.search);
    // const url = urlParams.get('url');
    urlParams.set('view', view);
    window.location.search = urlParams.toString();
    // window.location.href = `?url=${url}&view=${view}`;
}

document.querySelector('#view_tree').addEventListener('click', () => reloadWithView('tree'));
document.querySelector('#view_linear').addEventListener('click', () => reloadWithView('linear'));

document.querySelector('#collapse_all').addEventListener('click', () => {
    document.querySelectorAll('.subthread-post').forEach(elem => elem.open = false);
});
document.querySelector('#expand_all').addEventListener('click', () => { 
    document.querySelectorAll('.subthread-post').forEach(elem => elem.open = true);
});