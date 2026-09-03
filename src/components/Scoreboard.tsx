type ScoreboardProps = {
  x: number;
  o: number;
  xLabel?: string;
  oLabel?: string;
};

export function Scoreboard({
  x,
  o,
  xLabel = "X",
  oLabel = "O",
}: ScoreboardProps) {
  return (
    <div className="scoreboard">
      <div className="score x-score">
        {xLabel}: <span>{x}</span>
      </div>
      <div className="score o-score">
        {oLabel}: <span>{o}</span>
      </div>
    </div>
  );
}
