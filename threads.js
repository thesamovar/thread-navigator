export class Post {
    constructor(postobj, datetime, numLikes, numReposts, thread=null) {
        this.postobj = postobj;
        this.datetime = datetime;
        this.replies = [];
        this.numLikes = numLikes;
        this.numReposts = numReposts;
        this.has_computed_recursive_counts = false;
        this._recursiveNumLikes = numLikes;
        this._recursiveNumReposts = numReposts;
        this._recursiveNumReplies = 0;
        if(thread==null) {
            this.thread = this;
        } else {
            this.thread = thread;
        }
    }
    render() {
        const postContainer = this.renderPostContainer();
        return postContainer.post;
    }
    renderPostContainer() {
        const elem = document.createElement('div');
        elem.className = 'post';
        const pText = document.createElement('p');
        pText.className = 'post-text';
        const pAuthor = document.createElement('p');
        pAuthor.className = 'post-author';
        const pEngagement = document.createElement('p');
        pEngagement.className = 'post-engagement';
        pEngagement.innerHTML = this.countsHTML();
        const divHotness = document.createElement('div');
        divHotness.className = 'post-hotness';
        divHotness.style.backgroundColor = `hsl(${this.relativeEngagement*120}, 100%, 50%)`;
        elem.appendChild(pText);
        elem.appendChild(pAuthor);
        elem.appendChild(divHotness);
        elem.appendChild(pEngagement);
        return {'post': elem, 'text': pText, 'author': pAuthor, 'engagement': pEngagement, 'hotness': divHotness};
    }
    countsHTML() {
        return `<span class="engagement-post">↩️ ${this.numReplies} 🔁 ${this.numReposts} ⭐ ${this.numLikes}</span> <span class="engagement-thread">Thread: ↩️ ${this.recursiveNumReplies} 🔁 ${this.recursiveNumReposts} ⭐ ${this.recursiveNumLikes}</span>`;
    }
    get numReplies() { return this.replies.length; }
    compute_recursive_counts() {
        if (this.has_computed_recursive_counts) return;
        this.has_computed_recursive_counts = true;
        this._recursiveNumReplies = this.numReplies;
        this.replies.forEach(reply => {
            reply.compute_recursive_counts();
            this._recursiveNumLikes += reply._recursiveNumLikes;
            this._recursiveNumReposts += reply._recursiveNumReposts;
            this._recursiveNumReplies += reply._recursiveNumReplies;
        });
    }
    get recursiveNumLikes() {
        this.compute_recursive_counts();
        return this._recursiveNumLikes;
    }
    get recursiveNumReposts() {
        this.compute_recursive_counts();
        return this._recursiveNumReposts;
    }
    get recursiveNumReplies() {
        this.compute_recursive_counts();
        return this._recursiveNumReplies;
    }
    get engagement() {
        // return 0.01*this.recursiveNumLikes + 0.1*this.recursiveNumReposts + this.recursiveNumReplies;
        return this.recursiveNumReplies;
    }
    get relativeEngagement() {
        return this.engagement / this.thread.engagement;
    }
}

export function addIndentedView(post, level=0) {
    const postElem = post.render();
    postElem.style.marginLeft = `${level*40}px`;
    document.querySelector('body').appendChild(postElem);
    post.replies.forEach(reply => {
        addIndentedView(reply, level+1);
    });
}