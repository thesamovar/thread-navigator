const LIMIT = 59;
const myDid = "add_your_did";
const bskyAPI = "https://public.api.bsky.app/xrpc/";
const getLikesURL = `${bskyAPI}app.bsky.feed.getLikes?limit=${LIMIT}&uri=`;
const getPostURL = `${bskyAPI}app.bsky.feed.getPosts?uris=`;

async function f() {
    // the post is https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v
    // the "did:plc:niqde7rkzo7ua3scet2rzyt7" comes from the result of "https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=neuralreckoning.bsky.social"
    const postUri = "at://did:plc:niqde7rkzo7ua3scet2rzyt7/app.bsky.feed.post/3laqnjwy4622v";
    try {
        const bskyPost = await fetch(getPostURL + postUri);
        return bskyPost;
    } catch(e) {
        console.error(e);
    }
}

f().then(post=>console.log(post.json()));