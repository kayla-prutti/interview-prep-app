import type { PreparationNoteColor } from "../../types";

export type PreparationNoteStyle = {
  value: PreparationNoteColor;
  label: string;
  swatch: string;
  card: string;
  fold: string;
};

export const preparationNoteStyles: PreparationNoteStyle[] = [
  { value: "yellow", label: "Yellow", swatch: "bg-[#F7DE72]", card: "border-[#D8BD47] bg-[#FFF2A8]", fold: "bg-[#E4C855]" },
  { value: "pink", label: "Pink", swatch: "bg-[#F4A7B9]", card: "border-[#D88B9E] bg-[#FFD5DF]", fold: "bg-[#E89AAD]" },
  { value: "blue", label: "Blue", swatch: "bg-[#91C9EA]", card: "border-[#70ADD1] bg-[#CDEBFB]", fold: "bg-[#7CB9DB]" },
  { value: "green", label: "Green", swatch: "bg-[#A8D49E]", card: "border-[#83B879] bg-[#D6F0CF]", fold: "bg-[#91C487]" },
  { value: "orange", label: "Orange", swatch: "bg-[#F5AE68]", card: "border-[#D98C45] bg-[#FFD9AE]", fold: "bg-[#E69A51]" },
];

export function preparationNoteStyle(color?: PreparationNoteColor) {
  return preparationNoteStyles.find((style) => style.value === color) ?? preparationNoteStyles[0];
}
