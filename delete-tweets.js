#!/usr/bin/env node
/**
 * X/Twitter Bulk Tweet Deleter
 * 
 * Deletes all your tweets EXCEPT a pinned tweet thread you want to keep.
 * 
 * SETUP:
 *   1. Go to developer.x.com → your app → Keys and tokens
 *   2. Under "Authentication Tokens" find your Access Token and Access Token Secret
 *      (NOT the consumer key/secret — these are the USER-level tokens)
 *   3. If you don't have them, generate them with Read+Write permissions
 *   4. Paste all four values below
 *   5. Run: node delete-tweets.js
 * 
 * The script will:
 *   1. Fetch all your tweets (up to 3200, the API max)
 *   2. Identify your pinned tweet (skip it and its reply thread)
 *   3. Show you the full list of what will be deleted
 *   4. Wait for your confirmation (type "yes" to proceed)
 *   5. Delete them one at a time with a progress bar
 *   6. You can press Ctrl+C at any time to stop
 */

const https = require('https');

// ═══════════════════════════════════════════════════════════════════
// PASTE YOUR CREDENTIALS HERE
// ═══════════════════════════════════════════════════════════════════
const CONSUMER_KEY = 'c1cF6UxYNtPfDoT8QuBENMg4a';
const CONSUMER_SECRET = 'hk3MlsBeuIfS0LiGOXewMHhIudRqIH2JgwsDZ7E51ryxjhG9kR';
const ACCESS_TOKEN = '21327117-pxrvTIUkbnfvR69vmcZXB9yieQyZ4fsGP3C5arcPp';
const ACCESS_TOKEN_SECRET = 'XWo62xshBckBMSSAKFQp7pV3lsoUdMhcwzuHuMIuSU5sY';
// ═══════════════════════════════════════════════════════════════════

// ─── OAuth 1.0a signature generation ───
function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function hmacSha1(key, data) {
  const crypto = require('crypto');
  return crypto.createHmac('sha1', key).update(data).digest('base64');
}

function makeOAuthHeader(method, url, params) {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: require('crypto').randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0',
    ...params,
  };

  // Build signature base string
  const allParams = { ...oauthParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(ACCESS_TOKEN_SECRET)}`;
  oauthParams.oauth_signature = hmacSha1(signingKey, baseString);

  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');
}

// ─── API calls ───
function apiRequest(method, url, queryParams = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(url);
    for (const [k, v] of Object.entries(queryParams)) {
      fullUrl.searchParams.set(k, v);
    }
    const header = makeOAuthHeader(method, fullUrl.origin + fullUrl.pathname, queryParams);
    
    const req = https.request(fullUrl, {
      method,
      headers: { 'Authorization': header, 'User-Agent': 'TweetDeleter/1.0' },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Main ───
async function main() {
  if (CONSUMER_KEY === 'YOUR_CONSUMER_KEY') {
    console.log('\n❌ Please edit this file and paste your credentials first.\n');
    console.log('You need:');
    console.log('  • Consumer Key + Consumer Secret (from your X developer app)');
    console.log('  • Access Token + Access Token Secret (user-level OAuth 1.0a tokens)');
    console.log('\nGet them at: developer.x.com → your app → Keys and tokens\n');
    process.exit(1);
  }

  console.log('\n📋 Fetching your tweets...\n');

  // Step 0: Authenticate and get user info + pinned tweet ID
  const res = await apiRequest('GET', 'https://api.twitter.com/2/users/me', {'user.fields': 'pinned_tweet_id'});
  if (!res.data?.data?.id) {
    console.log('❌ Could not authenticate. Check your credentials.');
    console.log('Response:', JSON.stringify(res.data).slice(0, 200));
    process.exit(1);
  }
  const userId = res.data.data.id;
  console.log(`✅ Authenticated as @${res.data.data.username} (ID: ${userId})\n`);
  // Use pinned_tweet_id from API, fall back to the known pinned tweet ID
  const pinnedTweetId = res.data?.data?.pinned_tweet_id || '2011430464771535325';
  console.log(`📌 Pinned tweet ID: ${pinnedTweetId}\n`);

  // Step 1: Fetch all tweets (paginated, up to 3200)
  let allTweets = [];
  let paginationToken = null;
  let total = 0;

  for (let page = 0; page < 20; page++) { // 20 pages × 100 = 2000 max
    const params = {
      max_results: '100',
      'tweet.fields': 'created_at,public_metrics,referenced_tweets',
      exclude: 'retweets',
    };
    if (paginationToken) params.pagination_token = paginationToken;

    // Fetch tweets for this user
    const tweetRes = await apiRequest('GET', `https://api.twitter.com/2/users/${userId}/tweets`, params);
    if (tweetRes.status !== 200) {
      console.log(`API error: ${tweetRes.status}`, JSON.stringify(tweetRes.data).slice(0, 200));
      break;
    }
    
    const tweets = tweetRes.data.data || [];
    if (!tweets.length) break;
    
    allTweets.push(...tweets);
    total += tweets.length;
    console.log(`  Fetched ${total} tweets so far...`);

    if (!tweetRes.data.meta?.next_token) break;
    paginationToken = tweetRes.data.meta.next_token;
  }

  console.log(`\n📊 Total tweets found: ${allTweets.length}\n`);

  if (allTweets.length === 0) {
    console.log('No tweets to delete. You\'re all clean!');
    process.exit(0);
  }

  // Step 2: Identify pinned tweet and its reply thread
  const skipIds = new Set();
  const pinnedTweet = pinnedTweetId ? allTweets.find(t => t.id === pinnedTweetId) : null;
  
  if (pinnedTweetId) {
    skipIds.add(pinnedTweetId);
    // Also preserve the pinned tweet itself even if not in the fetched batch
    if (pinnedTweet) {
      console.log(`📌 Pinned tweet preserved: "${pinnedTweet.text.slice(0, 60)}..."`);
    } else {
      console.log(`📌 Pinned tweet preserved (ID: ${pinnedTweetId}, not in fetched batch)`);
    }
    // Find tweets that are replies in the pinned thread
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of allTweets) {
        if (skipIds.has(t.id)) continue;
        if (t.referenced_tweets?.some(r => r.type === 'replied_to' && skipIds.has(r.id))) {
          skipIds.add(t.id);
          changed = true;
        }
      }
    }
    console.log(`📌 Total tweets in pinned thread (preserved): ${skipIds.size}\n`);
  } else {
    console.log('⚠️  No pinned tweet found. ALL tweets will be deleted.\n');
  }

  // Step 3: Show what will be deleted
  const toDelete = allTweets.filter(t => !skipIds.has(t.id));
  console.log(`🗑️  Tweets to delete: ${toDelete.length}`);
  console.log(`✅ Tweets to keep: ${skipIds.size}\n`);
  
  console.log('First 5 tweets to be deleted:');
  toDelete.slice(0, 5).forEach((t, i) => {
    const date = new Date(t.created_at).toLocaleDateString();
    console.log(`  ${i + 1}. [${date}] ${t.text.slice(0, 70)}${t.text.length > 70 ? '...' : ''}`);
  });
  if (toDelete.length > 5) console.log(`  ... and ${toDelete.length - 5} more\n`);

  // Step 4: Confirm
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  THIS IS IRREVERSIBLE. Deleted tweets cannot be recovered.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const answer = await new Promise(resolve => {
    rl.question('\nType "DELETE" to confirm and proceed: ', resolve);
  });
  rl.close();

  if (answer.trim().toUpperCase() !== 'DELETE') {
    console.log('\n✋ Cancelled. No tweets were deleted.');
    process.exit(0);
  }

  // Step 5: Delete tweets with rate limit handling
  // X API allows 50 deletes per 15-minute window
  console.log(`\n🗑️  Deleting ${toDelete.length} tweets...\n`);
  console.log('  Rate limit: 50 deletes per 15 minutes — the script will auto-pause when needed.\n');
  let deleted = 0;
  let failed = 0;
  let deleteCount = 0; // tracks deletes in current window

  for (let idx = 0; idx < toDelete.length; idx++) {
    const tweet = toDelete[idx];
    
    // Check if we're about to hit the rate limit (50 per 15 min)
    if (deleteCount >= 49) {
      console.log('\n  ⏳ Rate limit reached (50 deletes). Waiting 15 minutes...\n');
      // Countdown timer
      for (let mins = 15; mins > 0; mins--) {
        process.stdout.write(`\r  Resuming in ${mins} minute${mins > 1 ? 's' : ''}...   `);
        await new Promise(r => setTimeout(r, 60000));
      }
      process.stdout.write('\r  Resuming now!                    \n\n');
      deleteCount = 0;
    }
    
    try {
      const res = await apiRequest('DELETE', `https://api.twitter.com/2/tweets/${tweet.id}`);
      if (res.status === 200 || res.status === 204) {
        deleted++;
        deleteCount++;
      } else if (res.status === 429) {
        // Hit rate limit unexpectedly — wait and retry this tweet
        console.log('\n  ⏳ Rate limited (429). Waiting 15 minutes...\n');
        for (let mins = 15; mins > 0; mins--) {
          process.stdout.write(`\r  Resuming in ${mins} minute${mins > 1 ? 's' : ''}...   `);
          await new Promise(r => setTimeout(r, 60000));
        }
        process.stdout.write('\r  Resuming now!                    \n\n');
        deleteCount = 0;
        idx--; // retry this tweet
        continue;
      } else if (res.status === 404) {
        // Already deleted — skip
        deleted++;
      } else {
        failed++;
        console.log(`\n  ❌ Failed: ${tweet.id} — ${res.status}`);
      }
    } catch (e) {
      failed++;
    }
    
    const pct = Math.round(((deleted + failed) / toDelete.length) * 100);
    process.stdout.write(`\r  Progress: ${deleted} deleted | ${failed} failed | ${pct}% done    `);
    
    // 1 second between deletes (slower = safer, avoids unexpected 429s)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n\n✅ Done! Deleted ${deleted} tweets, ${failed} failed.`);
  if (pinnedTweet) {
    console.log(`📌 Pinned tweet thread preserved (${skipIds.size} tweets kept).`);
  }
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
