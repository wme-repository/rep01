import { getNewPosts, markSocialGenerated } from '../../core/rss-reader.js';
import { generateSocialPost, publishSocialPost } from '../../integrations/blotado.js';

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

  if (parsed.generate || parsed.g) {
    const dryRun = parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true';
    const platform = parsed.platform || 'twitter';
    const platforms = parsed.all
      ? ['twitter', 'linkedin', 'facebook']
      : [platform];

    console.log('Fetching new posts from RSS...\n');

    let newPosts;
    try {
      newPosts = await getNewPosts();
    } catch (err) {
      console.error(`Error fetching RSS: ${err.message}`);
      return;
    }

    const count = parseInt(parsed.count || parsed.n || '999', 10);
    const postsToProcess = newPosts.slice(0, count);

    if (postsToProcess.length === 0) {
      console.log('No new posts to generate social content for.');
      return;
    }

    console.log(`Generating social posts for ${postsToProcess.length} new articles...\n`);

    for (const post of postsToProcess) {
      console.log(`\n=== ${post.title} ===`);
      for (const p of platforms) {
        const social = generateSocialPost(post, p);
        console.log(`[${p.toUpperCase()}] (${social.characterCount} chars):`);
        console.log(social.content);

        if (!dryRun) {
          try {
            const result = await publishSocialPost(social, p);
            console.log(`  → Published: ${result.url}`);
          } catch (err) {
            console.log(`  → Error: ${err.message}`);
          }
        } else {
          console.log('  → [DRY RUN] Not published');
        }
      }
    }

    // Mark posts as having social generated (for idempotency)
    await markSocialGenerated(postsToProcess);
  } else if (parsed.publish || parsed.p) {
    const platform = parsed.platform || 'twitter';
    const dryRun = parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true';

    let newPosts;
    try {
      newPosts = await getNewPosts();
    } catch (err) {
      console.error(`Error fetching RSS: ${err.message}`);
      return;
    }

    if (newPosts.length === 0) {
      console.log('No new posts available.');
      return;
    }

    const post = newPosts[0];
    const social = generateSocialPost(post, platform);

    console.log(`Publishing to ${platform.toUpperCase()}...\n`);
    console.log(social.content);

    if (!dryRun) {
      try {
        const result = await publishSocialPost(social, platform);
        console.log(`\n→ Published: ${result.url}`);
      } catch (err) {
        console.log(`\n→ Error: ${err.message}`);
      }
    } else {
      console.log('\n[DRY RUN] Post not published.');
    }
  } else {
    console.log('social --generate [--platform twitter] [--count N]  Generate social posts for new articles');
    console.log('social --publish [--platform twitter]   Publish social post for latest article');
    console.log('social --generate --all                Generate for all platforms');
    console.log('Options: --dry-run, --platform twitter|linkedin|facebook');
  }
}
