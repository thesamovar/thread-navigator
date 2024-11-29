import { Post } from './threads.js';

export class MastoPost extends Post {
    render() {
        const postContainer = this.renderPostContainer();
        postContainer.content.innerHTML = this.postobj.content;
        return postContainer.post;
    }
    shortHTML() { // TODO: cut out handles at beginning / end - maybe cut out all html and paragraphs?
        return `<b>${this.displayName}</b> ${this.postobj.content}`;
    }
    get profilePhotoURL() {
        return this.postobj.account.avatar;
    }
    get displayName() {
        return this.postobj.account.display_name;
    }
    get profileURL() {
        return this.postobj.account.url;
    }
    get postURL() {
        return this.postobj.url;
    }
    get handle() {
        return this.postobj.account.acct;
    }
    static async fromURL(url) {
        const the_thread = await get_masto_thread(url);
        const basepost = analyse_masto_thread(the_thread);
        return basepost;
    }
}

function get_api_base_url_from_masto_url(url) {
    const url_parts = url.split('/');
    return url_parts[0]+'//'+url_parts[2]+'/api/v1/statuses/';
}

function get_api_url_from_masto_url(url, baseurl=null) {
    const url_parts = url.split('/');
    if(baseurl===null) {
        baseurl = get_api_base_url_from_masto_url(url);
    }
    return baseurl+url_parts[url_parts.length-1];
}

async function get_masto_thread(url) {
    let posts = {};
    // const api_base_url = get_api_base_url_from_masto_url(url);
    // get the main post
    let data = await (await fetch(get_api_url_from_masto_url(url))).json();
    posts[data.url] = data;
    let to_process = [data.url];
    let processed = [];
    // get all children recursively until none left to process
    // have to do this because Masto API only gives 60 posts at a time
    while(to_process.length>0) {
        let current_url = to_process.shift();
        processed.push(current_url);
        // get the children, skipping any failures
        try {
            //await delay(1000); // rate limiting
            data = await (await fetch(get_api_url_from_masto_url(current_url)+'/context')).json();
            // console.log(get_api_url_from_masto_url(current_url, api_base_url)+'/context');
            // console.log(data);
        } catch(error) {
            if(!posts[current_url].parent_url) {
                posts[current_url].parent_url = 'missing'
            }
            console.log(error);
            continue;
        }
        for(let i=0; i<data.descendants.length; i++) {
            const child = data.descendants[i];
            posts[child.url] = child;
            if(!processed.includes(child.url) && !to_process.includes(child.url)) {
                to_process.push(child.url);
            }
        }
        let last_ancestor = null;
        for(let i=0; i<data.ancestors.length; i++) {
            const ancestor = data.ancestors[i];
            posts[ancestor.url] = ancestor;
            if(last_ancestor) {
                ancestor.parent_url = last_ancestor.url;
            }
            last_ancestor = ancestor;
            if(!processed.includes(ancestor.url) && !to_process.includes(ancestor.url)) {
                to_process.push(ancestor.url);
            }
        }
        if(last_ancestor) {
            posts[current_url].parent_url = last_ancestor.url;
        }
        // const children = data.descendants.concat(data.ancestors);
        // for (let i = 0; i < children.length; i++) {
        //     const child = children[i];
        //     posts[child.url] = child;
        //     child.parent_url = current_url;
        //     // if(!processed.includes(child.url) && !to_process.includes(child.url)) {
        //     //     to_process.push(child.url);
        //     // }
        // }
    }
    // for(const key in posts) {
    //     if(!posts[key].parent_url) {
    //         console.log('No parent for post', posts[key])
    //     } else {
    //         if(!(posts[key].parent_url in posts)) {
    //             console.log('Parent URL not found: ', posts[key].parent_url);
    //         }
    //     }
    // }
    // console.log(posts);
    return posts;
}

function analyse_masto_thread(the_thread) {
    // iterate over the thread and extract the parent of each post or record if the base
    var basepost = null;
    for(const key in the_thread) {
        const post = the_thread[key];
        if(!post.parent_url) {
            basepost = post;
        } else {
            if(post.parent_url in the_thread) {
                const parent = the_thread[post.parent_url];
                if(!parent.children) {
                    parent.children = [];
                }
                parent.children.push(post);
            } else {
                console.log('Parent not found for post', post);
            }
        }
    }
    // now convert into generic MastoPost objects
    function convert_post(post, root=null, parent=null) {
        const newpost = new MastoPost(post, post.created_at, post.favourites_count, post.reblogs_count, root, parent);
        if(root==null) {
            root = newpost;
        }
        if(post.children) {
            newpost.replies = post.children.map(child => convert_post(child, root, newpost));
        }
        return newpost;
    }
    return convert_post(basepost);
}
