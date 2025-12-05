import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTags() {
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('entity_type', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    process.exit(1);
  }

  console.log(`\nTotal tags: ${tags?.length || 0}\n`);
  console.log('='.repeat(80));

  const groupedByEntity = tags?.reduce((acc, tag) => {
    if (!acc[tag.entity_type]) {
      acc[tag.entity_type] = [];
    }
    acc[tag.entity_type].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  for (const [entityType, entityTags] of Object.entries(groupedByEntity || {})) {
    console.log(`\n${entityType.toUpperCase()} (${entityTags.length} tags):`);
    console.log('-'.repeat(80));
    
    entityTags.forEach(tag => {
      const status = tag.is_active ? '✓' : '✗';
      const publicBadge = tag.is_public ? '[PUBLIC]' : '[PRIVATE]';
      console.log(
        `${status} ${tag.emoji} ${tag.label.padEnd(20)} | ${publicBadge.padEnd(9)} | Order: ${tag.display_order.toString().padStart(2)} | Slug: ${tag.slug}`
      );
      if (tag.description) {
        console.log(`   ${tag.description.substring(0, 70)}${tag.description.length > 70 ? '...' : ''}`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
}

listTags();







