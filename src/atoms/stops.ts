import { atom, useRecoilState } from "recoil";

type Coordinate = [number, number];

export const stopsState = atom<Coordinate[]>({
  key: 'stopsState',
  default: [],
});

export const useStops = (): [Coordinate[], (index: number, value: Coordinate | null) => void] => {
  const [stops, setStops] = useRecoilState(stopsState);

  const changeStop = (index: number, value: Coordinate | null) => {
    setStops((prev) => {
      const newStops = [...prev];
      newStops[index] = value;
      return newStops;
    });
  }

  return [stops, changeStop];
}