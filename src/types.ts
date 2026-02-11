export interface Point {
  id: string;
  screenX: number;
  screenY: number;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  points: Record<string, Point>;
}
