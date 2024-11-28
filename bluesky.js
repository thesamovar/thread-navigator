import { Post } from './threads.js';

// for reference, this code is lifted from https://whitep4nth3r.com/blog/show-bluesky-likes-on-blog-posts/
// with extra bits thanks to @sneakers-the-rat
export class BlueskyAPI {
    static bskyAPI = "https://public.api.bsky.app/xrpc/";
    static getPostURL = `${BlueskyAPI.bskyAPI}app.bsky.feed.getPosts?uris=`;
    static getThreadURL = `${BlueskyAPI.bskyAPI}app.bsky.feed.getPostThread?depth=100&uri=`;
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
        const postContainer = this.renderPostContainer();
        postContainer.content.innerHTML = this.postobj.record.text;
        return postContainer.post;
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
    get profilePhotoURL() {
        return this.postobj.author.avatar;
    }
    get displayName() {
        return this.postobj.author.displayName;
    }
    get profileURL() {
        return `https://bsky.app/profile/${this.postobj.author.did}`;
    }
    get postURL() {
        const postId = this.postobj.uri.split('/').pop();
        return `https://bsky.app/profile/${this.postobj.author.did}/post/${postId}`;
    }
    get handle() {
        return this.postobj.author.handle;
    }
    static fromPost(post, thread=null, parent=null) {
        return new BlueskyPost(post, post.indexedAt, post.likeCount, post.repostCount+post.quoteCount, thread, parent);
    }
    static fromPostThread(thread, root=null, parent=null) {
        const post = BlueskyPost.fromPost(thread.post, root, parent);
        if(thread.replies) {
            thread.replies.forEach(reply => {
                const replyPost = BlueskyPost.fromPostThread(reply, post.thread, post);
                post.replies.push(replyPost);
            });
        }
        return post;
    }
    static async fromURL(url) {
        const thread = await BlueskyAPI.getThread(url);
        // console.log(thread.thread);
        const post = BlueskyPost.fromPostThread(thread.thread);
        return post;
    }
}