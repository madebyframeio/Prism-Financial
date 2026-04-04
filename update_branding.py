import os
import glob

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    # 1. Replace Bank Name
    content = content.replace('Citi Financials', 'Citi Financials')
    content = content.replace('Citi Financials', 'Citi Financials')
    
    # 2. Replace Primary Color configuration
    content = content.replace('primary: "#056dae"', 'primary: "#056dae"')
    content = content.replace('colors: { "primary": "#056dae" }', 'colors: { "primary": "#056dae" }')
    content = content.replace('colors: { "primary": "#0033cc" }', 'colors: { "primary": "#056dae" }')
    content = content.replace('"primary": "#056dae"', '"primary": "#056dae"')
    content = content.replace("'primary': '#056dae'", "'primary': '#056dae'")
    
    # 3. Replace Domain
    content = content.replace('kreditlithua-lithuania.netlify.app', 'citi-financials.netlify.app')
    content = content.replace('kreditlithua.netlify.app', 'citi-financials.netlify.app')
    content = content.replace('citi-financials.netlify.app', 'citi-financials.netlify.app')
    
    # 3. Strip serif fonts
    content = content.replace('serif: ["Source Serif 4", "serif"],', '')
    content = content.replace('&family=Source+Serif+4:wght@600;700', '')
    content = content.replace('font-serif', 'font-sans')
    
    # 4. Strip Urbanist font from admin
    content = content.replace('family=Urbanist:ital,wght@0,100..900;1,100..900', 'family=Inter:wght@300;400;600;700;800;900')
    content = content.replace('fontFamily: { "sans": ["\'Urbanist\'", "sans-serif"] }', 'fontFamily: { "sans": ["\'Inter\'", "sans-serif"] }')
    content = content.replace('font-family: \'Urbanist\', sans-serif;', 'font-family: \'Inter\', sans-serif;')
    
    # 5. Update hover states
    content = content.replace('hover:bg-green-700', 'hover:bg-blue-900')
    content = content.replace('hover:bg-green-800', 'hover:bg-blue-900')
    
    # 6. Final brand sweep
    content = content.replace('Prisim', 'Citi Financials')
    content = content.replace('Citi Financials', 'Citi Financials')
    content = content.replace('PRISIM', 'CITI')
    content = content.replace('CITI', 'CITI')
    content = content.replace('prisim-finance.com', 'citi-financials.netlify.app')
    content = content.replace('citi-financials.netlify.app', 'citi-financials.netlify.app')
    content = content.replace('citi-financials.netlify.app', 'citi-financials.netlify.app')
    
    with open(file, 'w') as f:
        f.write(content)

print(f"Updated {len(html_files)} files.")
