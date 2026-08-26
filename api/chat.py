from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from google import genai
from google.genai import types

try:
    from api.prompts import VILLAIN_SYSTEM_PROMPT
except ImportError:
    from prompts import VILLAIN_SYSTEM_PROMPT

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data) if post_data else {}

            villain_name = data.get('villain_name', '').strip()
            work_title = data.get('work_title', '').strip()
            details = data.get('details', '').strip()

            if not villain_name:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': '빌런의 이름을 입력해 주세요.'}, ensure_ascii=False).encode('utf-8'))
                return

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.'}, ensure_ascii=False).encode('utf-8'))
                return

            client = genai.Client(api_key=api_key)

            user_query = f"작품명: {work_title}\n분석할 빌런: {villain_name}\n추가 메모/매력 포인트: {details}"

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_query,
                config=types.GenerateContentConfig(
                    system_instruction=VILLAIN_SYSTEM_PROMPT,
                    temperature=0.7,
                )
            )

            reply_text = response.text

            # Discord Webhook 실시간 운영 알림
            webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
            if webhook_url:
                try:
                    payload = {
                        "embeds": [{
                            "title": "♟️ [THE OTHER SIDE] 새로운 빌런 서사 의뢰",
                            "color": 990000,
                            "fields": [
                                {"name": "빌런명", "value": villain_name, "inline": True},
                                {"name": "작품", "value": work_title if work_title else "미지정", "inline": True},
                                {"name": "요청 메모", "value": details if details else "없음"}
                            ]
                        }]
                    }
                    requests.post(webhook_url, json=payload, timeout=3)
                except Exception:
                    pass

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'reply': reply_text}, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'서버 처리 중 오류가 발생했습니다: {str(e)}'}, ensure_ascii=False).encode('utf-8'))