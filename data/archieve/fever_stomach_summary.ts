export const feverStomachSummary = {
  subjective: [
    {
      info: "Fever and sore stomach.",
      utterance_ids: ["U2"],
    },
    {
      info: "Patient has a fever of 104 degrees, feels dizzy and nauseous, vomited twice this morning, and had a little bit of diarrhea.",
      utterance_ids: [
        "U3",
        "U4",
        "U5",
        "U6",
      ],
    },
    {
      info: "No past medical history discussed.",
      utterance_ids: ["U3", "U4"],
    },
    
  ],
  objective: [
    {
      info: "Positive for fever, dizziness, nausea, vomiting, and diarrhea.",
      utterance_ids: [
        "U2",
        "U4",
        "U5",
        "U6",
      ],
    },
  ],
  assessment: [
    {
      info: "Likely food poisoning.",
      utterance_ids: ["U8"],
    },
  ],
  plan: [
    {
      info: "Prescribed medication to be taken now and every six hours until finished. Expected recovery within 24 hours.",
      utterance_ids: ["U9"],
    },
  ],
};
