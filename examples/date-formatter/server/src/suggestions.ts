import type {Suggestion} from "@superhuman/plugins-sdk/dist/suggestion_types";
import type {SuggestionRequest} from "@superhuman/plugins-sdk/dist/suggestion_types";
import type {SuggestionResponse} from "@superhuman/plugins-sdk/dist/suggestion_types";
import compromiseDates from "compromise-dates";
import nlp from "compromise";
const nlpWithDates = nlp.extend(compromiseDates);

// The data returned by compromise-dates for a match.
interface DateMatch {
  offset: {start: number; length: number};
}

// A suggestion endpoint can return at most 500 suggestions.
const MaxSuggestions = 500;

export function findDateSuggestions(
  request: SuggestionRequest,
): SuggestionResponse {
  let {text, currentSuggestions, dismissedSuggestions} = request;
  // Ignore any text that has already been suggested or dismissed.
  let ignoreText = new Set<string>();
  for (let prior of [
    ...(currentSuggestions ?? []),
    ...(dismissedSuggestions ?? []),
  ]) {
    ignoreText.add(prior.original);
  }

  let matches = nlpWithDates(text).dates().json({offset: true}) as DateMatch[];
  let suggestions: Suggestion[] = [];

  for (let match of matches) {
    let startOffset = match.offset.start;
    let endOffset = startOffset + match.offset.length;
    let originalText = text.slice(startOffset, endOffset);
    if (ignoreText.has(originalText)) {
      continue;
    }
    let replacementText = nlpWithDates(originalText)
      .dates()
      .format("iso-short")
      .text();
    if (replacementText === "" || replacementText === originalText) {
      continue;
    }

    suggestions.push({
      startOffset: startOffset,
      endOffset: endOffset,
      original: originalText,
      replacement: replacementText,
      title: "Use ISO 8601",
      explanation: `
        ISO 8601 is the best date format because it's unambiguous, sorts easily,
        works across the world, and is easy for humans and machines to use. 
      `,
    });
  }

  return {suggestions: suggestions.slice(0, MaxSuggestions)};
}
