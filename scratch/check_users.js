const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fmhjbyxljorruczvpajx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_75ADZ3UaNBRzrBtwrQM5nw_CcIqPaEI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
