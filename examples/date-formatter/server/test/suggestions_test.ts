import {expect} from "chai";
import {findDateSuggestions} from "../src/suggestions";
import worker from "../src/index";

describe("findDateSuggestions", () => {
  it("rewrites the span compromise reports, including neighbouring words", () => {
    let text = "Due Sept 5, 2026.";
    let {
      suggestions: [suggestion],
    } = findDateSuggestions({text: text});
    expect(suggestion.original).to.equal(text);
    expect(suggestion.replacement).to.equal("2026-09-05.");
    expect(text.slice(suggestion.startOffset, suggestion.endOffset)).to.equal(
      suggestion.original,
    );
  });

  it("rewrites a long month-day-year date with exact offsets", () => {
    let text = "The launch is March 5, 2026.";
    let {suggestions} = findDateSuggestions({text: text});
    expect(suggestions).to.have.length(1);
    let [suggestion] = suggestions;
    expect(suggestion.startOffset).to.equal(14);
    expect(suggestion.endOffset).to.equal(28);
    expect(text.slice(suggestion.startOffset, suggestion.endOffset)).to.equal(
      suggestion.original,
    );
    expect(suggestion.original).to.equal("March 5, 2026.");
    expect(suggestion.replacement).to.equal("2026-03-05.");
    expect(suggestion.title).to.equal("Use ISO 8601");
  });

  it("uses UTF-16 offsets after characters outside the BMP", () => {
    // The party emoji is two UTF-16 code units. The ISO date is already
    // in the target format, so only the written date is suggested.
    let text = "Emoji 🎉 then 2026-03-05 and 5 March 2026 done.";
    let {suggestions} = findDateSuggestions({text: text});
    expect(suggestions).to.have.length(1);
    let [suggestion] = suggestions;
    expect(suggestion.original).to.equal("5 March 2026");
    expect(suggestion.startOffset).to.equal(text.indexOf("5 March 2026"));
    expect(text.slice(suggestion.startOffset, suggestion.endOffset)).to.equal(
      "5 March 2026",
    );
    expect(suggestion.replacement).to.equal("2026-03-05");
  });

  it("rewrites each date compromise reports", () => {
    let text = "Start March 5, 2026. End 5 April 2026.";
    let {suggestions} = findDateSuggestions({text: text});
    expect(suggestions.map(suggestion => suggestion.replacement)).to.deep.equal(
      ["2026-03-05.", "2026-04-05."],
    );
    for (let suggestion of suggestions) {
      expect(text.slice(suggestion.startOffset, suggestion.endOffset)).to.equal(
        suggestion.original,
      );
    }
  });

  it("suggests nothing when the formatted span is unchanged", () => {
    for (let text of [
      "Invoice dated 03/05/2026.",
      "Ship it today.",
      "Logged 2026-03-05T10:00:00Z.",
    ]) {
      expect(findDateSuggestions({text: text})).to.deep.equal({
        suggestions: [],
      });
    }
  });

  it("truncates to the maximum number of suggestions", () => {
    let text = Array.from({length: 501}, (_, index) => {
      let day = (index % 28) + 1;
      let year = 2000 + Math.floor(index / 28);
      return `January ${day}, ${year}.`;
    }).join(" ");
    let {suggestions} = findDateSuggestions({text: text});
    expect(suggestions).to.have.length(500);
  });

  it("returns no suggestions for text without dates", () => {
    expect(findDateSuggestions({text: "Nothing to see here."})).to.deep.equal({
      suggestions: [],
    });
  });

  it("skips a date the user has not evaluated yet", () => {
    let text = "The launch is March 5, 2026. Ship on 5 April 2026.";
    let {
      suggestions: [pending, other],
    } = findDateSuggestions({text: text});
    expect(
      findDateSuggestions({text: text, currentSuggestions: [pending]}),
    ).to.deep.equal({suggestions: [other]});
  });

  it("skips a date the user dismissed", () => {
    let text = "The launch is March 5, 2026. Ship on 5 April 2026.";
    let {
      suggestions: [dismissed, other],
    } = findDateSuggestions({text: text});
    expect(
      findDateSuggestions({text: text, dismissedSuggestions: [dismissed]}),
    ).to.deep.equal({suggestions: [other]});
  });

  it("skips a dismissed date even when the stored replacement differs", () => {
    expect(
      findDateSuggestions({
        text: "The launch is March 5, 2026.",
        dismissedSuggestions: [
          {
            original: "March 5, 2026.",
            title: "Use ISO 8601",
            explanation: "Earlier rewrite.",
            replacement: "March 5th, 2026.",
          },
        ],
      }),
    ).to.deep.equal({suggestions: []});
  });

  it("still suggests other dates when one is current and one was dismissed", () => {
    let text = "Start March 5, 2026. Next is 5 April 2026. End May 1, 2026.";
    let {
      suggestions: [first, second, third],
    } = findDateSuggestions({text: text});
    expect(
      findDateSuggestions({
        text: text,
        currentSuggestions: [first],
        dismissedSuggestions: [second],
      }),
    ).to.deep.equal({suggestions: [third]});
  });
});

describe("suggestions endpoint", () => {
  let token = "test-secret-token";

  async function post(
    body: string,
    headers: Record<string, string> = {authorization: `Bearer ${token}`},
    env: {AUTH_TOKEN?: string} = {AUTH_TOKEN: token},
  ): Promise<Response> {
    return worker.fetch(
      new Request("http://localhost/suggestions", {
        method: "POST",
        headers: {"content-type": "application/json", ...headers},
        body: body,
      }),
      env,
    );
  }

  it("rejects a request without an Authorization header", async () => {
    let response = await post(JSON.stringify({text: "March 5, 2026."}), {});
    expect(response.status).to.equal(401);
  });

  it("rejects a request with the wrong bearer token", async () => {
    let response = await post(JSON.stringify({text: "March 5, 2026."}), {
      authorization: "Bearer wrong-token",
    });
    expect(response.status).to.equal(401);
  });

  it("rejects every request when AUTH_TOKEN is not configured", async () => {
    let response = await post(
      JSON.stringify({text: "March 5, 2026."}),
      {authorization: `Bearer ${token}`},
      {},
    );
    expect(response.status).to.equal(401);
  });

  it("rewrites a confident date to YYYY-MM-DD with the right token", async () => {
    let response = await post(
      JSON.stringify({text: "The launch is March 5, 2026."}),
    );
    expect(response.status).to.equal(200);
    let payload = (await response.json()) as {
      suggestions: Array<{original: string; replacement: string}>;
    };
    expect(payload.suggestions).to.have.length(1);
    expect(payload.suggestions[0].original).to.equal("March 5, 2026.");
    expect(payload.suggestions[0].replacement).to.equal("2026-03-05.");
  });

  it("rejects a body without text", async () => {
    let response = await post("{}");
    expect(response.status).to.equal(400);
  });

  it("rejects a body with unknown properties", async () => {
    let response = await post(
      JSON.stringify({text: "March 5, 2026.", extra: 1}),
    );
    expect(response.status).to.equal(400);
  });

  it("does not repeat current or dismissed date rewrites", async () => {
    let response = await post(
      JSON.stringify({
        text: "The launch is March 5, 2026. Ship on 5 April 2026.",
        currentSuggestions: [
          {
            original: "March 5, 2026.",
            title: "Use ISO 8601",
            explanation: "Still open.",
            replacement: "2026-03-05.",
          },
        ],
        dismissedSuggestions: [
          {
            original: "on 5 April 2026.",
            title: "Use ISO 8601",
            explanation: "Rejected.",
            replacement: "2026-04-05.",
          },
        ],
      }),
    );
    expect(response.status).to.equal(200);
    let payload = (await response.json()) as {
      suggestions: Array<{original: string}>;
    };
    expect(payload.suggestions).to.deep.equal([]);
  });

  it("still rewrites a date the user previously accepted", async () => {
    let response = await post(
      JSON.stringify({
        text: "The launch is March 5, 2026.",
        acceptedSuggestions: [
          {
            original: "March 5, 2026.",
            title: "Use ISO 8601",
            explanation: "Accepted earlier.",
            replacement: "2026-03-05.",
          },
        ],
      }),
    );
    expect(response.status).to.equal(200);
    let payload = (await response.json()) as {
      suggestions: Array<{original: string; replacement: string}>;
    };
    expect(payload.suggestions).to.have.length(1);
    expect(payload.suggestions[0].original).to.equal("March 5, 2026.");
    expect(payload.suggestions[0].replacement).to.equal("2026-03-05.");
  });

  it("returns 404 for any request other than POST /suggestions", async () => {
    let requests = [
      new Request("http://localhost/suggestions"),
      new Request("http://localhost/health", {method: "POST"}),
    ];
    for (let request of requests) {
      let response = await worker.fetch(request);
      expect(response.status).to.equal(404);
    }
  });
});
