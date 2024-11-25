export class Post {
    constructor(postobj, datetime) {
        this.postobj = postobj;
        this.datetime = datetime;
        this.replies = [];
    }
    render() {
        const elem = document.createElement('div');
        elem.className = 'post';
        return elem;
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