import os
import json
import datetime
import random
from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAatnrQ8q_JpW02elONR6ES55YxXT5rxaY")
DATA_FILE_PATH = os.path.join("public", "data.json")

current_time = datetime.datetime.utcnow() + datetime.timedelta(hours=8)
today_str = current_time.strftime("%Y-%m-%d")
time_suffix = current_time.strftime("%Y-%m-%d-%H%M")

def generate_content_from_gemini():
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    topic_pool = [
        {"name": "日本自助旅行、觀光與交通搭乘", "category": "旅遊探索"},
        {"name": "自家烘焙咖啡店點餐、手沖風味與豆單討論", "category": "咖啡品鑑"},
        {"name": "居酒屋點餐與下班後的放鬆閒聊", "category": "美食文化"},
        {"name": "與好朋友的週末生活與日常對話", "category": "生活日常"},
        {"name": "專注學習、閱讀與自我提升的心得", "category": "學習成長"},
        {"name": "熱血體育賽事討論（足球、棒球或網球）", "category": "運動休閒"}
    ]
    chosen = random.choice(topic_pool)
    daily_topic = chosen["name"]
    daily_category = chosen["category"]
    
    prompt = f"""
    請以「{daily_topic}」為主題，創作一篇純日語的極簡生活化教材。
    【JSON 輸出格式要求】：
    1. 課程對話 (lesson): 4到6句的簡短生活對話。
    2. 情報牆 (trend): 100字以內日語短文與4個實用單字。
    3. 日文歌 (song): 真實日本流行歌，節錄4句歌詞。絕對必須提供真實 YouTube 11碼ID。
    【核心防禦】：所有日文內容只要出現「漢字」，必須使用 HTML <ruby> 標籤加上 <rt> 標註平假名五十音。
    期望的 JSON 結構（直接回傳純JSON）：
    {{
      "id": "entry-{time_suffix}",
      "date": "{today_str}",
      "category": "{daily_category}",
      "lesson": {{
        "title": "中文標題", "subtitle": "中文副標題",
        "dialogue": [ {{ "id": 1, "speaker": "A", "avatar": "🧑", "ja": "含ruby", "zh": "翻譯" }} ]
      }},
      "trend": {{
        "titleTarget": "日文標題含ruby", "titleZh": "翻譯", "summary": "短文含ruby",
        "keywords": [ {{ "word": "含ruby", "speechText": "發音", "definition": "解釋" }} ]
      }},
      "song": {{
        "title": "歌名", "artist": "歌手", "youtube_id": "11碼ID",
        "lyrics": [ {{ "line_id": 1, "original": "含ruby", "romaji": "羅馬拼音", "translation": "翻譯" }} ]
      }}
    }}
    """
    
    response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
    raw_text = response.text.strip()
    if raw_text.startswith("```json"): raw_text = raw_text[7:]
    if raw_text.endswith("```"): raw_text = raw_text[:-3]
    return json.loads(raw_text.strip())

def update_local_database(new_entry):
    if os.path.exists(DATA_FILE_PATH):
        with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                data = []
    else:
        data = []
        
    data.insert(0, new_entry)
    if len(data) > 100: data = data[:100]
        
    with open(DATA_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    for attempt in range(1, 4):
        try:
            new_data = generate_content_from_gemini()
            update_local_database(new_data)
            print("🎉 本地純日語教材 data.json 更新完畢！")
            break
        except Exception as e:
            print(f"嘗試 {attempt} 失敗: {e}")
            import time
            time.sleep(5)
