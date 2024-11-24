// for reference, this code is lifted from https://whitep4nth3r.com/blog/show-bluesky-likes-on-blog-posts/
// with extra bits thanks to @sneakers-the-rat
const LIMIT = 59;
const myDid = "add_your_did";
const bskyAPI = "https://public.api.bsky.app/xrpc/";
const getLikesURL = `${bskyAPI}app.bsky.feed.getLikes?limit=${LIMIT}&uri=`;
const getPostURL = `${bskyAPI}app.bsky.feed.getPosts?uris=`;
const resolveDID = `${bskyAPI}com.atproto.identity.resolveHandle?handle=`;

async function f() {
    // the post is https://bsky.app/profile/neuralreckoning.bsky.social/post/3laqnjwy4622v
    // the "did:plc:niqde7rkzo7ua3scet2rzyt7" comes from the result of "https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=neuralreckoning.bsky.social"
    const didresponse = await fetch(resolveDID + 'neuralreckoning.bsky.social');
    const did_json = await didresponse.json();
    const did = did_json['did']
    console.log(did);

    const postUri = `at://${did}/app.bsky.feed.post/3laxflzvmis2d`;
    try {
        const bskyPost = await fetch(getPostURL + postUri);
        const bskyJSON = await bskyPost.json();
        return bskyJSON;
    } catch(e) {
        console.error(e);
    }
}

f().then(post=>console.log(post));