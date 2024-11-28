import { BlueskyPost } from './bluesky.js';
import { loadFromURLParams, loadFromURL } from './layout.js';

async function test() {
    //const post = await BlueskyPost.fromURL("https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v");
    //const post = await BlueskyPost.fromURL("https://bsky.app/profile/gunnarblohm.bsky.social/post/3lbq6tzx6g22x");
    // const post = await BlueskyPost.fromURL("https://bsky.app/profile/richardsever.bsky.social/post/3law46gxckc26"); // very challenging deep thread
    await loadFromURL('https://bsky.app/profile/richardsever.bsky.social/post/3law46gxckc26', 'linear');
    // await loadFromURL('https://neuromatch.social/deck/@neuralreckoning/113535307884835205');
    
    // addIndentedView(post);
}

await test();