// for reference, this code is lifted from https://whitep4nth3r.com/blog/show-bluesky-likes-on-blog-posts/
// with extra bits thanks to @sneakers-the-rat
const bskyAPI = "https://public.api.bsky.app/xrpc/";
const getPostURL = `${bskyAPI}app.bsky.feed.getPosts?uris=`;
const getThreadURL = `${bskyAPI}app.bsky.feed.getPostThread?uri=`;
const resolveDID = `${bskyAPI}com.atproto.identity.resolveHandle?handle=`;

function renderPost(post) {
    console.log(post);
    const elem = document.createElement('div');
    elem.className = 'post';
    const postId = post.uri.split('/').pop();
    elem.innerHTML = `
        <p class="post-text">${post.record.text}</p>
        <p class="post-author">
            &mdash;<span class="post-displayname">${post.author.displayName}</span>
            (<a class="post-handle" href="https://bsky.app/profile/${post.author.did}">@${post.author.handle}</a>)
            <a class="post-indexed" href="https://bsky.app/profile/${post.author.did}/post/${postId}">${post.indexedAt}</a>
        </p>
    `;
    // This is how Bluesky embeds look but this doesn't seem to work because the script doesn't execute
    // elem.innerHTML = `
    // <blockquote class="bluesky-embed" data-bluesky-uri="${post.uri}" data-bluesky-cid="${post.cid}">
    //     <p lang="en">
    //         ${post.record.text}
    //     </p>        
    //     &mdash; ${post.author.displayName} (<a href="https://bsky.app/profile/${post.author.did}?ref_src=embed">@${post.author.handle}</a>) <a href="https://bsky.app/profile/${post.author.did}/post/${postId}?ref_src=embed">${post.indexedAt}</a>
    // </blockquote>
    // <!--<script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>-->
    // `;
   return elem;
}

async function analyseURL(url) {
    // example is https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v
    // want to break this into ["neuralreckoning.bsky.social", "3laqnjwy4622v"]
    const parts = url.split('/');
    const user = parts[4];
    const postId = parts[6];
    const didresponse = await fetch(resolveDID + user);
    const did_json = await didresponse.json();
    const did = did_json['did']
    return {"did": did, "postId": postId};
}

function add_thread(thread, level=0) {
    const post = renderPost(thread.post);
    post.style.marginLeft = `${level*40}px`;
    document.querySelector('body').appendChild(post);
    thread.replies.forEach(reply => {
        add_thread(reply, level+1);
    });
}

async function f() {
    res = await analyseURL("https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v");
    const did = res.did;
    const postId = res.postId;
    const postUri = `at://${did}/app.bsky.feed.post/${postId}`;

    const thread = await (await fetch(getThreadURL + postUri)).json();
    add_thread(thread.thread);
}

f();