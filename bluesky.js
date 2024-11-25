import { Post } from './threads.js';

// for reference, this code is lifted from https://whitep4nth3r.com/blog/show-bluesky-likes-on-blog-posts/
// with extra bits thanks to @sneakers-the-rat
export class BlueskyAPI {
    static bskyAPI = "https://public.api.bsky.app/xrpc/";
    static getPostURL = `${BlueskyAPI.bskyAPI}app.bsky.feed.getPosts?uris=`;
    static getThreadURL = `${BlueskyAPI.bskyAPI}app.bsky.feed.getPostThread?uri=`;
    static resolveDID = `${BlueskyAPI.bskyAPI}com.atproto.identity.resolveHandle?handle=`;
    static async analyseURL(url) {
        // example is https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v
        // want to break this into ["neuralreckoning.bsky.social", "3laqnjwy4622v"]
        const parts = url.split('/');
        const user = parts[4];
        const postId = parts[6];
        const didresponse = await fetch(BlueskyAPI.resolveDID + user);
        const did_json = await didresponse.json();
        const did = did_json['did']
        return {"did": did, "postId": postId};
    }
    static async getThread(url) {
        const res = await BlueskyAPI.analyseURL(url);
        const did = res.did;
        const postId = res.postId;
        const postUri = `at://${did}/app.bsky.feed.post/${postId}`;
        const thread = await (await fetch(BlueskyAPI.getThreadURL + postUri)).json();
        return thread;
    }
}

export class BlueskyPost extends Post {
    render() {
        const elem = super.render();
        const postId = this.postobj.uri.split('/').pop();
        elem.innerHTML = `
            <p class="post-text">${this.postobj.record.text}</p>
            <p class="post-author">
                &mdash;<span class="post-displayname">${this.postobj.author.displayName}</span>
                (<a class="post-handle" href="https://bsky.app/profile/${this.postobj.author.did}">@${this.postobj.author.handle}</a>)
                <a class="post-indexed" href="https://bsky.app/profile/${this.postobj.author.did}/post/${postId}">${this.postobj.indexedAt}</a>
        </p>
        `;
        return elem;
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
    }
    static fromPost(post) {
        return new BlueskyPost(post, post.indexedAt);
    }
    static fromPostThread(thread) {
        const post = BlueskyPost.fromPost(thread.post);
        thread.replies.forEach(reply => {
            const replyPost = BlueskyPost.fromPostThread(reply);
            post.replies.push(replyPost);
        });
        return post;
    }
    static async fromURL(url) {
        const thread = await BlueskyAPI.getThread(url);
        const post = BlueskyPost.fromPostThread(thread.thread);
        return post;
    }
}