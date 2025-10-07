/*
 * Validation: Compare Mongo vs Supabase for DSA categories and problems
 * - Verifies counts
 * - Computes sampled hashes for key fields
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const crypto = require('crypto');
const mongoose = require('mongoose');
const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/DSAProblem');
const { getSupabaseClient } = require('../utils/supabaseClient');

function hashRow(obj) {
  const canonical = JSON.stringify(obj);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}


async function fetchAllSupabase(supabase, table, select, orderBy) {
  const pageSize = 1000;
  let from = 0;
  let all = [];
  for (;;) {
    let query = supabase.from(table).select(select).order(orderBy, { ascending: true }).range(from, from + pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');

  await mongoose.connect(process.env.MONGODB_URI);

  // Categories
  const [mongoCats, supaCats] = await Promise.all([
    DSACategory.find({}).select('slug name').sort({ slug: 1 }).lean(),
    fetchAllSupabase(supabase, 'dsa_categories', 'slug,name', 'slug')
  ]);

  // Problems
  const mongoProblems = await DSAProblem.find({})
    .select('problemNumber title difficulty category tags acceptanceRate isActive functionName')
    .populate('category', 'slug')
    .sort({ problemNumber: 1 })
    .lean();

  const supaProblems = await fetchAllSupabase(
    supabase,
    'dsa_problems',
    'problem_number,title,difficulty,category_slug,tags,acceptance_rate,is_active,function_name',
    'problem_number'
  );

  // Counts
  const counts = {
    categories: { mongo: mongoCats.length, supabase: supaCats.length },
    problems: { mongo: mongoProblems.length, supabase: supaProblems.length }
  };

  // Sampled hashes (first 20 by order)
  const sampleSize = 20;
  const catSamples = Array.from({ length: Math.min(sampleSize, mongoCats.length) }, (_, i) => i);
  const probSamples = Array.from({ length: Math.min(sampleSize, mongoProblems.length) }, (_, i) => i);

  const catHashes = catSamples.map(i => ({
    index: i,
    mongo: hashRow({ slug: mongoCats[i].slug, name: mongoCats[i].name }),
    supabase: hashRow({ slug: supaCats[i]?.slug, name: supaCats[i]?.name })
  }));

  const probHashes = probSamples.map(i => ({
    index: i,
    mongo: hashRow({
      problem_number: mongoProblems[i].problemNumber,
      title: mongoProblems[i].title,
      difficulty: mongoProblems[i].difficulty,
      category_slug: mongoProblems[i].category?.slug,
      tags: mongoProblems[i].tags,
      acceptance_rate: mongoProblems[i].acceptanceRate ?? null,
      is_active: mongoProblems[i].isActive !== false,
      function_name: mongoProblems[i].functionName || null
    }),
    supabase: hashRow({
      problem_number: supaProblems[i]?.problem_number,
      title: supaProblems[i]?.title,
      difficulty: supaProblems[i]?.difficulty,
      category_slug: supaProblems[i]?.category_slug,
      tags: supaProblems[i]?.tags || [],
      acceptance_rate: supaProblems[i]?.acceptance_rate ?? null,
      is_active: supaProblems[i]?.is_active !== false,
      function_name: supaProblems[i]?.function_name || null
    })
  }));

  const catMismatches = catHashes.filter(h => h.mongo !== h.supabase);
  const probMismatches = probHashes.filter(h => h.mongo !== h.supabase);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ counts, catMismatches, probMismatches }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


