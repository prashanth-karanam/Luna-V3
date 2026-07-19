import re

with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update .chat-marquee > ul > li to have somewhat opaque background instead of transparent
content = re.sub(
    r'\.chat-marquee > ul > li \{([^}]+)background-color:\s*transparent;',
    r'.chat-marquee > ul > li {\1background-color: rgba(0, 180, 255, 0.1);',
    content
)

# 2. Add margin-bottom to .chat-container to create a gap from the bottom
content = re.sub(
    r'(\.chat-container \{[^\}]+z-index:\s*2;[^}]+box-shadow:[^;]+;)',
    r'\1 margin-bottom: 20px;',
    content
)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(content)
