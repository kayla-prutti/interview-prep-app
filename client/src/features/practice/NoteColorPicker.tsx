import type { PreparationNoteColor } from "../../types";
import { preparationNoteStyles } from "./preparationNoteStyles";

type NoteColorPickerProps = {
  value: PreparationNoteColor;
  onChange: (color: PreparationNoteColor) => void;
};

export function NoteColorPicker({ value, onChange }: NoteColorPickerProps) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-bold text-[#303030]">Note color</legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {preparationNoteStyles.map((style) => (
          <label className="cursor-pointer" key={style.value} title={style.label}>
            <input className="peer sr-only" name="note-color" type="radio" value={style.value} checked={value === style.value} onChange={() => onChange(style.value)} />
            <span className={`grid h-10 w-10 place-items-center rounded-full border-2 border-white shadow-sm ring-1 ring-[#BDBDB8] transition hover:scale-110 peer-checked:ring-2 peer-checked:ring-[#202020] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#F5822A] ${style.swatch}`}>
              <span className="sr-only">{style.label}</span>
              {value === style.value && <span aria-hidden="true" className="text-lg font-bold text-[#202020]">✓</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
