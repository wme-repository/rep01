import { getNewPosts, markPostsProcessed } from '../../core/rss-reader.js';

function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-/g, '_');
      parsed[key] = true;
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed[key] = args[++i];
      }
    } else if (arg.startsWith('-')) {
      parsed[arg.slice(1).replace(/-/g, '_')] = true;
    } else {
      parsed._.push(arg);
    }
  }
  return parsed;
}

export default async function(args) {
  const parsed = parseArgs(args);

  if (parsed.h || parsed.help) {
    console.log('read-rss [--count N]  Read RSS feed and detect new posts');
    return;
  }

  const count = parseInt(parsed.count || parsed.n || '10', 10);

  try {
    const newPosts = await getNewPosts();

    if (newPosts.length === 0) {
      console.log('No new posts found in RSS feed.');
      return;
    }

    console.log(`\n=== ${newPosts.length} New Posts ===\n`);
    for (const post of newPosts.slice(0, count)) {
      console.log(`Title: ${post.title}`);
      console.log(`Link: ${post.link}`);
      console.log(`Published: ${post.pubDate}`);
      console.log('---');
    }

    if (newPosts.length > count) {
      console.log(`\n(+ ${newPosts.length - count} more posts)`);
    }

    // Mark as processed
    await markPostsProcessed(newPosts.slice(0, count));
    console.log(`\nMarked ${Math.min(count, newPosts.length)} posts as processed.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}
