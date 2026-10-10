import { flashcardDecks, type Flashcard } from "./decks";

export type StudyCard = Flashcard & { id: string };
export type StudyDeck = { id: string; title: string; description: string; cards: StudyCard[] };
export type FlashcardChanges = {
  edits: Record<string, Flashcard>;
  created: (StudyCard & { deckId: string })[];
};

export const emptyChanges = (): FlashcardChanges => ({ edits: {}, created: [] });
const storageKey = (accountId: string) => `i-prep-flashcards-v1:${accountId}`;

function isCard(value: unknown): value is Flashcard {
  return typeof value === "object" && value !== null &&
    "front" in value && typeof value.front === "string" && value.front.trim() !== "" &&
    "back" in value && typeof value.back === "string" && value.back.trim() !== "";
}

export function loadChanges(accountId: string): FlashcardChanges {
  const saved = localStorage.getItem(storageKey(accountId));
  if (!saved) return emptyChanges();
  const value = JSON.parse(saved) as FlashcardChanges;
  if (!value || typeof value.edits !== "object" || value.edits === null ||
    !Object.values(value.edits).every(isCard) || !Array.isArray(value.created) ||
    !value.created.every((card) => isCard(card) && typeof card.id === "string" && typeof card.deckId === "string")) {
    throw new Error("Your saved flashcards could not be read. Please try reloading the page.");
  }
  return value;
}

export function saveChanges(accountId: string, changes: FlashcardChanges) {
  try {
    localStorage.setItem(storageKey(accountId), JSON.stringify(changes));
  } catch {
    throw new Error("Could not save your flashcard. Check that browser storage is available and try again.");
  }
}

export function studyDecks(changes: FlashcardChanges): StudyDeck[] {
  return flashcardDecks.map((deck) => ({
    ...deck,
    cards: [
      ...deck.cards.map((card, index) => {
        const id = `${deck.id}:${index}`;
        return { ...card, ...changes.edits[id], id };
      }),
      ...changes.created.filter((card) => card.deckId === deck.id),
    ],
  }));
}
