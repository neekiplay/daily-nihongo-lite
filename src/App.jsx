import React, { useState, useEffect } from 'react';

// 👑 無敵解碼器
const createSafeMarkup = (text) => {
  if (!text) return { __html: "" };
  let str = text;
  for (let i = 0; i < 3; i++) {
    str = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#60;/g, '<').replace(/&#62;/g, '>');
  }
  return { __html: str };
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    fetch('./data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("讀取失敗:", err);
        setLoading(false);
      });
  }, []);

  const speak = (text, id) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    let str = text;
    for (let i = 0; i < 3; i++) {
      str = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
    const cleanedText = str.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    utterance.onstart = () => setPlayingId(id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>載入中...☕</div>;
  if (data.length === 0) return <div style={{padding: '40px', textAlign: 'center'}}>尚未生成教材，請執行 Python 腳本。</div>;

  const current = data[0]; 

  return (
    <div className="app-container">
      <header style={{marginBottom: '24px'}}>
        <h1 style={{fontSize: '24px', margin: '0 0 8px 0'}}>純日語極簡生活站</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          <span style={{background: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px'}}>{current.date}</span>
          <span style={{background: '#fee2e2', color: '#be123c', padding: '4px 10px', borderRadius: '12px', fontSize: '12px'}}>{current.category}</span>
        </div>
      </header>

      {/* 對話區 */}
      <section style={{background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px'}}>
        <h2 style={{fontSize: '18px', margin: '0 0 16px 0'}}>{current.lesson.title}</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {current.lesson.dialogue.map(row => (
            <div key={row.id} style={{display: 'flex', gap: '12px', flexDirection: row.speaker === 'A' ? 'row' : 'row-reverse'}}>
              <div style={{fontSize: '24px'}}>{row.avatar}</div>
              <div style={{background: row.speaker === 'A' ? '#f1f5f9' : '#e0f2fe', padding: '12px', borderRadius: '12px', maxWidth: '80%', cursor: 'pointer'}} onClick={() => speak(row.ja, `dialogue-${row.id}`)}>
                <p style={{margin: '0 0 8px 0', fontSize: '15px', color: playingId === `dialogue-${row.id}` ? '#4f46e5' : '#0f172a'}} dangerouslySetInnerHTML={createSafeMarkup(row.ja)} />
                <p style={{margin: '0', fontSize: '13px', color: '#64748b'}}>{row.zh}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 歌曲捲軸區 */}
      {current.song && (
        <section style={{background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #fecdd3', marginBottom: '24px'}}>
          <h2 style={{fontSize: '18px', margin: '0 0 4px 0'}} dangerouslySetInnerHTML={createSafeMarkup(current.song.title)} />
          <p style={{fontSize: '13px', color: '#64748b', margin: '0 0 16px 0'}} dangerouslySetInnerHTML={createSafeMarkup(`🎙️ ${current.song.artist}`)} />
          
          {current.song.youtube_id && (
             <a href={`https://www.youtube.com/watch?v=${current.song.youtube_id}`} target="_blank" rel="noreferrer" style={{display: 'block', background: '#0f172a', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', marginBottom: '16px'}}>
               👉 點我前往 YouTube 聆聽原唱
             </a>
          )}

          <div style={{height: '350px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
            {current.song.lyrics.map(line => (
              <div key={line.line_id} onClick={() => speak(line.original, `song-${line.line_id}`)} style={{background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #fca5a5', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                <p style={{margin: '0 0 4px 0', fontSize: '15px', color: playingId === `song-${line.line_id}` ? '#e11d48' : '#1e293b'}} dangerouslySetInnerHTML={createSafeMarkup(line.original)} />
                <p style={{margin: '0 0 4px 0', fontSize: '12px', color: '#a21caf', fontFamily: 'monospace'}}>{line.romaji}</p>
                <p style={{margin: '0', fontSize: '13px', color: '#475569'}}>{line.translation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
