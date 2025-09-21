import React, { useState, useRef } from 'react'
import './App.css'
import Player from './components/Player'
import WebcamCapture from './components/WebcamCapture'
import { sendImageToApi } from './api'

function App() {
  const [audioSrc, setAudioSrc] = useState(null)
  const [trackInfo, setTrackInfo] = useState({ title: 'No track', artist: '', album: '', cover: null })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [simLoading, setSimLoading] = useState(false)
  const [lastApiResponse, setLastApiResponse] = useState(null)
  const [audioError, setAudioError] = useState(null)
  const [error, setError] = useState(null)
  const playerRef = useRef()
  const prevObjectUrl = useRef(null)

  async function fetchAndUseBlob(url) {
    if (!url) return
    try {
      setError(null)
      setLoading(true)
      const fetched = await fetch(url, { method: 'GET', mode: 'cors' })
      if (!fetched.ok) throw new Error(`Failed to download audio: ${fetched.status} ${fetched.statusText}`)
      const blob = await fetched.blob()
      const mime = blob.type || ''
      if (!mime.startsWith('audio/') && mime !== 'application/octet-stream') {
        throw new Error(`Downloaded file is not an audio type: ${mime}`)
      }
      const obj = URL.createObjectURL(blob)
      if (prevObjectUrl.current) try { URL.revokeObjectURL(prevObjectUrl.current) } catch (e) {}
      prevObjectUrl.current = obj
      setAudioSrc(obj)
      // record in history using current trackInfo as a best-effort
      setHistory(h => [{ title: trackInfo.title || 'Unknown', artist: trackInfo.artist || '', album: trackInfo.album || '', cover: trackInfo.cover || null, src: obj, playedAt: Date.now() }, ...h].slice(0, 20))
      setSimLoading(true)
    } catch (e) {
      console.error('Fallback fetch failed', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCapture(blob) {
    setError(null)
    setLoading(true)
    try {
      const res = await sendImageToApi(blob)

      // If sendImageToApi returned a blob+metadata (audio streamed in POST), handle it here
      if (res && res.blob && res.metadata) {
        const audioBlob = res.blob
        const md = res.metadata || {}
        setLastApiResponse({ type: 'audio-blob', metadata: md })
        setTrackInfo({
          title: md.title || 'Generated track',
          artist: md.artist || '',
          album: md.album || '',
          cover: md.cover || null,
        })
        const url = URL.createObjectURL(audioBlob)
        if (prevObjectUrl.current) {
          try { URL.revokeObjectURL(prevObjectUrl.current) } catch (e) {}
        }
        prevObjectUrl.current = url
        setAudioSrc(url)
        // add to history
        setHistory(h => [{ title: md.title || 'Generated track', artist: md.artist || '', album: md.album || '', cover: md.cover || null, src: url, playedAt: Date.now() }, ...h].slice(0, 20))
        setTimeout(() => playerRef.current?.play(), 100)
        return
      }

      // Otherwise fall back to previous behavior where res is a fetch Response
      if (res && res.headers) {
        const contentType = res.headers.get('content-type') || ''
        let audioBlob
        if (contentType.includes('application/json')) {
          const json = await res.json()
          setLastApiResponse(json)
          const fileUrl = json.file_url || json.url
          if (fileUrl) {
            if (prevObjectUrl.current) {
              try { URL.revokeObjectURL(prevObjectUrl.current) } catch (e) {}
              prevObjectUrl.current = null
            }
            setAudioSrc(fileUrl)
            setHistory(h => [{ title: (json.track && json.track.name) || json.title || 'Generated track', artist: (json.track && json.track.artist) || json.artist || '', album: (json.track && json.track.album) || json.album || '', cover: json.cover || json.artwork || json.album_art || null, src: fileUrl, playedAt: Date.now() }, ...h].slice(0, 20))
            setTrackInfo({ title: (json.track && json.track.name) || json.title || 'Generated track', artist: (json.track && json.track.artist) || json.artist || '', album: (json.track && json.track.album) || json.album || '', cover: json.cover || json.artwork || json.album_art || null })
            setSimLoading(true)
            return
          }
          setTrackInfo({ title: json.title || 'Generated track', artist: json.artist || '', album: json.album || '', cover: json.cover || json.artwork || json.album_art || null })
        } else if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
          audioBlob = await res.blob()
          setLastApiResponse({ type: 'audio-blob' })
          setTrackInfo({ title: 'Generated track', artist: '', album: '', cover: null })
        } else {
          // fallback — try to parse json
          try {
            const json = await res.json()
            setLastApiResponse(json)
            if (json.url) {
              const fetched = await fetch(json.url)
              audioBlob = await fetched.blob()
              setTrackInfo({ title: json.title || 'Generated track', artist: json.artist || '', album: json.album || '', cover: json.cover || json.artwork || json.album_art || null })
            } else {
              throw new Error('Unexpected API response')
            }
          } catch (e) {
            throw new Error('Unsupported response from API')
          }
        }

        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob)
          if (prevObjectUrl.current) {
            try { URL.revokeObjectURL(prevObjectUrl.current) } catch (e) {}
          }
          prevObjectUrl.current = url
          setAudioSrc(url)
          setHistory(h => [{ title: 'Generated track', artist: '', album: '', cover: null, src: url, playedAt: Date.now() }, ...h].slice(0, 20))
          setTimeout(() => playerRef.current?.play(), 100)
        }
      }
    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function playAtIndex(i) {
    const item = history[i]
    if (!item) return
    setAudioSrc(item.src)
    setTrackInfo({ title: item.title || 'Track', artist: item.artist || '', album: item.album || '', cover: item.cover || null })
    setTimeout(() => playerRef.current?.play(), 100)
  }

  function playPrevious() {
    // find current index in history and play the next older item
    const idx = history.findIndex(h => h.src === audioSrc)
    if (idx === -1) return
    const nextIdx = Math.min(history.length - 1, idx + 1)
    playAtIndex(nextIdx)
  }

  function playNext() {
    const idx = history.findIndex(h => h.src === audioSrc)
    if (idx === -1) return
    const prevIdx = Math.max(0, idx - 1)
    playAtIndex(prevIdx)
  }

  return (
    <div id="app-root" className="app-root">
      <main className="main">
        <header className="main-header">
          <h1>Capture & Generate</h1>
          <p>Use your webcam to send a photo to the API and play the returned audio.</p>
        </header>

        <section className="content-grid">
          <div className="capture-card">
            <WebcamCapture onCapture={handleCapture} disabled={loading} />
            {loading && (
              <div className="overlay upload-overlay">
                <div className="spinner" />
                <div className="upload-text">Uploading photo…</div>
              </div>
            )}
            {error && <div className="error">{error}</div>}
          </div>

          <div className="player-card">
            <Player
              ref={playerRef}
              src={audioSrc}
              title={trackInfo.title}
              artist={trackInfo.artist}
              album={trackInfo.album}
              cover={trackInfo.cover}
              history={history}
              onPlayPrevious={playPrevious}
              onPlayNext={playNext}
              loading={simLoading}
              onCanPlay={() => { setSimLoading(false); setLoading(false); playerRef.current?.play() }}
              onError={(err) => {
                setAudioError(err); setSimLoading(false); setLoading(false)
                // If unsupported format, try fetching as blob and playing via object URL (may work around some server issues)
                if (err && err.toLowerCase().includes('unsupported')) {
                  fetchAndUseBlob(audioSrc)
                }
              }}
            />
          </div>

          <aside className="history-card">
            <h3>Previously played</h3>
            {history.length === 0 ? (
              <div className="history-empty">No tracks played yet</div>
            ) : (
              <ul className="history-list">
                {history.map((item, idx) => (
                  <li key={item.playedAt || idx} className="history-item" onClick={() => { setAudioSrc(item.src); playerRef.current?.seek(0); playerRef.current?.play() }}>
                    <div className="history-cover" style={{ backgroundImage: item.cover ? `url(${item.cover})` : undefined }} />
                    <div className="history-meta">
                      <div className="history-title">{item.title}</div>
                      <div className="history-artist">{item.artist}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="debug-card">
            <h3>Debug</h3>
            <div><strong>API response:</strong></div>
            <pre className="debug-pre">{lastApiResponse ? JSON.stringify(lastApiResponse, null, 2) : '—'}</pre>
            <div><strong>Audio src:</strong> {audioSrc ? (<a href={audioSrc} target="_blank" rel="noreferrer">{audioSrc}</a>) : '—'}</div>
            <div><strong>Audio error:</strong> {audioError || '—'}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
