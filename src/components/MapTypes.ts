import { type } from "arktype";

const CoordinatePair = type(["number", "number"]);
const BoundsPair = type([CoordinatePair, CoordinatePair]);
const PointsArray = CoordinatePair.array().atLeastLength(2);

export const MapComponentProps = type({
  bounds: BoundsPair,
  points: PointsArray,
  "height?": "string",
  "width?": "string",
  "showMarkers?": "boolean",
});
export type MapComponentProps = typeof MapComponentProps.infer;
