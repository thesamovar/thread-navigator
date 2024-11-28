export class Post {
    constructor(postobj, datetime, numLikes, numReposts, thread=null, parent=null) {
        this.postobj = postobj;
        this.datetime = new Date(datetime);
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
        this.parent = parent;
    }
    render() {
        const postContainer = this.renderPostContainer();
        return postContainer.post;
    }
    profileURL() {
        return null;
    }
    get profilePhotoURL() {
        return null;
    }
    get displayName() {
        return null;
    }
    get postURL() {
        return null;
    }
    get handle() {
        return null;
    }
    renderPostContainer() {
        const elem = document.createElement('div');
        elem.className = 'post';

        // left bar for relative engagement and profile image
        const divLeft = document.createElement('div');
        divLeft.className = 'post-left';
        divLeft.style.backgroundColor = `hsl(0, ${60*this.relativeEngagement}%, 50%)`;
        const profileImg = document.createElement('img');
        profileImg.src = this.profilePhotoURL;
        profileImg.className = 'post-profile';
        divLeft.appendChild(profileImg);

        // right bar for post author, text, engagement
        const divRight = document.createElement('div');
        divRight.className = 'post-right';

        // body: author and content
        const divBody = document.createElement('div');
        divBody.className = 'post-body';
        const divAuthor = document.createElement('div');
        divAuthor.className = 'post-author';
        const divContent = document.createElement('div');
        divContent.className = 'post-content';
        divBody.appendChild(divAuthor);
        divBody.appendChild(divContent);

        // footer: engagement
        const divEngagement = document.createElement('div');
        divEngagement.className = 'post-engagement';
        divEngagement.innerHTML = this.countsHTML();

        divRight.appendChild(divBody);
        divRight.appendChild(divEngagement);

        elem.appendChild(divLeft);
        elem.appendChild(divRight);

        divAuthor.innerHTML = `<span class="post-displayname">${this.displayName}</span>
                               (<a class="post-handle" href="${this.profileURL}">@${this.handle}</a>)
                               <a class="post-indexed" href="${this.postURL}">${this.datetime.toLocaleString()}</a>`;

        return {'post': elem, 'content': divContent, 'author': divAuthor};
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
        return 0.01*this.recursiveNumLikes + 0.1*this.recursiveNumReposts + this.recursiveNumReplies;
        // return this.recursiveNumReplies;
    }
    get relativeEngagement() {
        return this.engagement / this.thread.engagement;
    }
}
