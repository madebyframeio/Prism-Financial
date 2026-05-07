const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fmhjbyxljorruczvpajx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_75ADZ3UaNBRzrBtwrQM5nw_CcIqPaEI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*');
    
    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

checkSettings();
