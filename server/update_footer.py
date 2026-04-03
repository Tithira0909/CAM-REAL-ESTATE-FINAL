import os
import re

def update_footer(directory):
    # Regex to find the entire copyright div block
    # It looks for the start of the copyright div and everything until the closing div
    # Handling potential variations in whitespace and the copyright symbol
    pattern = re.compile(
        r'<div class="copyright">.*?<div class="pera">.*?<p>.*?(?:Copyright|&#169;|ⓒ) 2024 CAM Holdings .*?</p>.*?</div>.*?<ul>.*?<li><a href="#">Terms & Condition</a></li>.*?<li>\|</li>.*?<li><a href="#">Privacy</a></li>.*?</ul>.*?</div>',
        re.DOTALL | re.IGNORECASE
    )

    # The new footer content
    replacement = """<div class="copyright">
            <div class="pera">
              <p>ⓒCopyright 2026 CAM Holdings . All rights reserved</p>
            </div>
            <ul>
                <li>Powered by <a href="https://www.zeatralabs.com" target="_blank" style="color: inherit; text-decoration: none;">Zeatra Labs</a></li>
            </ul>
          </div>"""

    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .git
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if file.endswith('.html'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Use a more flexible replace if the block regex is too strict
                # Some files might have slightly different spacing or attributes
                new_content = pattern.sub(replacement, content)
                
                # Fallback: Just replace the specific lines if the block pattern fails
                if new_content == content:
                    # Replace 2024 with 2026
                    new_content = re.sub(r'(Copyright|&#169;|ⓒ) 2024 CAM Holdings', r'\1 2026 CAM Holdings', content)
                    # Replace the T&C/Privacy list with the new Powered By list
                    # This looks for the UL after the pera div
                    new_content = re.sub(
                        r'<ul>\s*<li><a href="#">Terms & Condition</a></li>\s*<li>\|</li>\s*<li><a href="#">Privacy</a></li>\s*</ul>',
                        '<ul><li>Powered by <a href="https://www.zeatralabs.com" target="_blank" style="color: inherit; text-decoration: none;">Zeatra Labs</a></li></ul>',
                        new_content,
                        flags=re.DOTALL
                    )

                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")

if __name__ == "__main__":
    update_footer(os.getcwd())
