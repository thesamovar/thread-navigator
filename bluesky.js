import { Post, htmlToNode } from './threads.js';

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
        postContainer.content.innerHTML = this.renderFacetsHTML();
        if(this.postobj.embed) {
            const embedContainer = this.renderEmbedContainer();
            if(this.postobj.embed['$type']=='app.bsky.embed.images#view') {
                const embed = document.createElement('div');
                embed.className = 'post-embed-images';
                this.postobj.embed.images.forEach(image => {
                    const linkElem = document.createElement('a');
                    linkElem.href = image.fullsize;
                    linkElem.target = '_blank';
                    const img = document.createElement('img');
                    img.src = image.thumb;
                    img.alt = image.alt;
                    linkElem.appendChild(img);
                    embed.appendChild(linkElem);
                });
                // embed.innerHTML = this.postobj.record.embed.toString();
                embedContainer.appendChild(embed);
            }
            if(this.postobj.embed['$type']=='app.bsky.embed.external#view') {
                const embed = htmlToNode(`
                    <div class="post-embed-external">
                        <a href="${this.postobj.embed.external.uri}">
                            <img src="${this.postobj.embed.external.thumb}">
                            <div class="external-title">${this.postobj.embed.external.title}</div>
                            <div class="external-description">${this.postobj.embed.external.description}</div>
                            <div class="external-url">${this.postobj.embed.external.uri}</div>
                        </a>
                    </div>
                    `);
                embedContainer.appendChild(embed);
            }
            if(this.postobj.embed['$type']=='app.bsky.embed.record#view') {
                const rec = this.postobj.embed.record;
                if(rec.author) {
                    const embed = htmlToNode(`
                        <div class="post-embed-record">
                            <b>${rec.author.displayName}</b><br>${rec.value.text}
                        </div>
                        `);
                    embedContainer.appendChild(embed);
                }
            }
            postContainer.content.appendChild(embedContainer);
        }
        return postContainer.post;
    }
    renderFacetsHTML() {
        // so facets is nonsense because javascript stores text as utf16 but facet indices are utf8, so
        // we need to convert between them.
        const facets = this.postobj.record.facets;
        if(facets==null) {
            return this.postobj.record.text;
        }
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        var text = textEncoder.encode(this.postobj.record.text);
        facets.sort((a, b) => b.index.byteStart - a.index.byteStart); // we want the last ones first to simplify replace
        facets.forEach(facet => {
            const start = facet.index.byteStart;
            const end = facet.index.byteEnd;
            const before = text.slice(0, start);
            let middle = text.slice(start, end);
            const after = text.slice(end);
            facet.features.forEach(feature => {
                if(feature['$type']=='app.bsky.richtext.facet#link') {
                    const decoded_middle = (new TextDecoder()).decode(middle);
                    middle = `<a href="${feature.uri}">${decoded_middle}</a>`;
                    middle = textEncoder.encode(middle);
                }
                if(feature['$type']=='app.bsky.richtext.facet#mention') {
                    const decoded_middle = (new TextDecoder()).decode(middle);
                    middle = `<a href="https://bsky.app/profile/${decoded_middle.slice(1)}">${decoded_middle}</a>`;
                    middle = textEncoder.encode(middle);
                }
                if(feature['$type']=='app.bsky.richtext.facet#tag') {
                    const decoded_middle = (new TextDecoder()).decode(middle);
                    middle = `<a href="https://bsky.app/hashtag/${decoded_middle.slice(1)}">${decoded_middle}</a>`;
                    middle = textEncoder.encode(middle);
                }
            });
            // this is complete and utter nonsense but it works for now because I couldn't figure out a nicer way
            // to concatenate Uint8Arrays (sigh).
            text = textDecoder.decode(before) + textDecoder.decode(middle) + textDecoder.decode(after);
            text = textEncoder.encode(text);
        });
        return textDecoder.decode(text);
    }
    shortHTML() {
        return `<b>${this.displayName}</b> ${this.postobj.record.text}`;
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
        // console.log(post);
        const newpost = new BlueskyPost(post, post.indexedAt, post.likeCount, post.repostCount+post.quoteCount, thread, parent);
        newpost._replyCount = post.replyCount;
        return newpost;
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