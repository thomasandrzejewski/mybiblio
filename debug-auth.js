// debug-auth.js - Debug script to check authentication and database permissions
// Include this in your HTML to debug auth issues: <script src="debug-auth.js" type="module"></script>

async function debugAuth() {
  try {
    // Check Supabase config
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.error('❌ Supabase config missing');
      return;
    }
    console.log('✅ Supabase config found');

    // Import Supabase
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      console.log('→ User is NOT authenticated');
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('ℹ️  User not authenticated (null)');
    }

    // Try to read shelves (public read)
    console.log('\n📖 Testing shelves read (public)...');
    const { data: shelves, error: shelvesError } = await supabase.from('shelves').select('*').limit(1);
    if (shelvesError) {
      console.error('❌ Read shelves error:', shelvesError);
    } else {
      console.log('✅ Read shelves success:', shelves);
    }

    // Try to create a shelf (requires auth)
    if (!user) {
      console.log('\n⚠️  Cannot test shelf creation - user not authenticated');
      console.log('→ You need to sign in first!');
    } else {
      console.log('\n📖 Testing shelf creation (requires auth)...');
      const testShelfName = `Test Shelf ${Date.now()}`;
      const { data: newShelf, error: createError } = await supabase
        .from('shelves')
        .insert({ name: testShelfName })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Create shelf error:', createError);
        console.error('→ Details:', createError.message, createError.details);
      } else {
        console.log('✅ Create shelf success:', newShelf);
        
        // Clean up test shelf
        await supabase.from('shelves').delete().eq('id', newShelf.id);
        console.log('→ Test shelf deleted');
      }
    }

    // Check RLS policies
    console.log('\n🔐 Row Level Security (RLS) Status:');
    console.log('→ Check Supabase dashboard for RLS settings on "shelves" and "books" tables');

  } catch (err) {
    console.error('❌ Debug error:', err);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', debugAuth);
