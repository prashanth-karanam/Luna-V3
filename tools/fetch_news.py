import sys
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

def fetch_news(keyword):
    try:
        # Default to fifa and cricket if empty
        if not keyword or keyword.strip() == "":
            keyword = "fifa and cricket"
            
        encoded_kw = urllib.parse.quote(keyword)
        url = f"https://news.google.com/rss/search?q={encoded_kw}&hl=en-US&gl=US&ceid=US:en"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req, timeout=8).read()
        
        root = ET.fromstring(html)
        items = root.findall('.//item')[:4]  # Get top 4 news articles
        
        results = []
        for item in items:
            title = item.find('title').text if item.find('title') is not None else ""
            link = item.find('link').text if item.find('link') is not None else ""
            
            # Extract source if possible (usually after the last dash in Google News titles)
            source = "Google News"
            if "-" in title:
                parts = title.rsplit("-", 1)
                title = parts[0].strip()
                source = parts[1].strip()
                
            results.append({
                "title": title,
                "link": link,
                "source": source
            })
            
        return json.dumps({"ok": True, "data": results})
    except Exception as e:
        return json.dumps({"error": str(e), "data": [{"title": f"Failed to load news for {keyword}", "link": "#", "source": "System"}]})

if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else "fifa and cricket"
    print(fetch_news(kw))
