interface Props {
  onInstall: () => void
}

export default function Library({ onInstall }: Props) {
  return (
    <div>
      <div className="page-header">
        <h1>🎮 Library</h1>
        <p>Your installed games</p>
      </div>

      <div className="library-grid">
        <div className="empty-library">
          <div className="empty-icon">🎮</div>
          <h3>No games yet</h3>
          <p>Install your first game to see it here</p>
          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={onInstall}>
            ⚡ Install a Game
          </button>
        </div>
      </div>
    </div>
  )
}