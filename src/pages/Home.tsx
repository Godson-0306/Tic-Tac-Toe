import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="container">
      <h1 className="title">Tic Tac Toe</h1>
      <p className="subtitle">Choose your mode</p>
      <div className="modes">
        <Link to="/local" className="mode-btn">
          Local (2 Players)
        </Link>
        <Link to="/ai" className="mode-btn">
          Play vs AI
        </Link>
        <Link to="/online" className="mode-btn highlight">
          Online Multiplayer
        </Link>
      </div>
    </div>
  );
}
