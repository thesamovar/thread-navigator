import {MastoPost} from './mastodon.js';
import {BlueskyPost} from './bluesky.js';
import {addIndentedView} from './threads.js';

export async function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    // let view = urlParams.get('view');
    // if(view===null) {
    //     view = 'linear';
    // }
    // view = {'linear': render_masto_thread_linear,
    //         'table-vertical': render_masto_thread_table_vertical,
    //         'table-horizontal': render_masto_thread_table_horizontal}[view];
    if(url) {
        // document.querySelector('#mastodon_url').value = url;
        // mastoview_load_and_render(url, view);
        loadFromURL(url);
    }
}

export async function loadFromURL(url) {
    let post;
    if(url.includes('bsky.app')) {
        post = await BlueskyPost.fromURL(url);
    } else {
        post = await MastoPost.fromURL(url);
    }
    addIndentedView(post);
}