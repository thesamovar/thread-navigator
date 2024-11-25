import { BlueskyPost } from './bluesky.js';
import { addIndentedView } from './threads.js';

async function test() {
    const post = await BlueskyPost.fromURL("https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v");
    addIndentedView(post);
}

await test();