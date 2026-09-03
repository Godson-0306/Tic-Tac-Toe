import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type GameLayoutProps = {
  title: string;
  children: ReactNode;
};

export function GameLayout({ title, children }: GameLayoutProps) {
  return (
    <>
      <Link to="/" className="back-btn">
        ← Back
      </Link>
      <div className="container">
        <h1 className="title">{title}</h1>
        {children}
      </div>
    </>
  );
}
