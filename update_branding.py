import os
import glob

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    # 1. Replace Bank Name
    content = content.replace('Prisim Finance', 'Prism Financials')
    content = content.replace('Prisim', 'Prism')
    
    # 2. Replace Primary Color configuration
    content = content.replace('colors: { "primary": "#002855" }', 'colors: { "primary": "#008450" }')
    content = content.replace('colors: { "primary": "#0033cc" }', 'colors: { "primary": "#008450" }')
    
    # 3. Strip serif fonts
    content = content.replace('serif: ["Source Serif 4", "serif"],', '')
    content = content.replace('&family=Source+Serif+4:wght@600;700', '')
    content = content.replace('font-serif', 'font-sans')
    
    # 4. Strip Urbanist font from admin
    content = content.replace('family=Urbanist:ital,wght@0,100..900;1,100..900', 'family=Inter:wght@300;400;600;700;800;900')
    content = content.replace('fontFamily: { "sans": ["\'Urbanist\'", "sans-serif"] }', 'fontFamily: { "sans": ["\'Inter\'", "sans-serif"] }')
    content = content.replace('font-family: \'Urbanist\', sans-serif;', 'font-family: \'Inter\', sans-serif;')
    
    with open(file, 'w') as f:
        f.write(content)

print(f"Updated {len(html_files)} files.")
