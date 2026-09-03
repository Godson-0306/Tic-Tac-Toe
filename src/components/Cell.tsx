import type { CellValue } from "../game/logic";

type CellProps = {
  value: CellValue;
  index: number;
  isWin: boolean;
  disabled: boolean;
  onClick: (index: number) => void;
};

export function Cell({ value, index, isWin, disabled, onClick }: CellProps) {
  const classes = ["cell"];
  if (value) classes.push(value.toLowerCase(), "pop");
  if (isWin) classes.push("win");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      disabled={disabled || Boolean(value)}
      onClick={() => onClick(index)}
      aria-label={value ? `Cell ${index + 1}, ${value}` : `Cell ${index + 1}, empty`}
    />
  );
}
