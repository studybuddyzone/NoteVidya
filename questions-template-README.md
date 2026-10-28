# Question Bank JSON — Field Guide

Har baar naye questions banane ke liye `questions-template.json` copy karo, usme apne questions bhar do, phir `quiz-host.html` → Create Quiz → Question Bank → **JSON Import** tab me "Upload JSON File" se upload karo.

## Rules
- Poori file ek **array** `[ ]` honi chahiye — chahe 1 question ho ya 100.
- Har question `{ }` object hai, array ke andar comma se alag.
- Extra/missing comma se JSON invalid ho jaata hai — validate karne ke liye https://jsonlint.com use kar sakte ho upload se pehle.

## Fields

| Field | Zaroori? | Type | Notes |
|---|---|---|---|
| `question` | ✅ Zaroori | text | Question ka poora text |
| `options` | ✅ Zaroori | object | Exactly `A`, `B`, `C`, `D` keys, chaaron bharo |
| `correctAnswer` | ✅ Zaroori | `"A"` / `"B"` / `"C"` / `"D"` | Sirf ek letter, uppercase |
| `marks` | Optional | number | Sahi jawab ke marks (default: `1`) |
| `negativeMarks` | Optional | number | Galat jawab pe kitna katega (default: `0`, tabhi lagega jab quiz me "Negative Marking" ON ho) |
| `difficulty` | Optional | `"easy"` / `"medium"` / `"hard"` | Sirf record ke liye, quiz behavior change nahi karta (default: `"medium"`) |
| `topic` | Optional | text | Chapter/topic naam, khaali bhi chhod sakte ho |
| `explanation` | Optional | text | Baad me result me dikhane ke liye, khaali bhi chhod sakte ho |

## Minimal example (sirf zaroori fields)
```json
[
  {
    "question": "2 + 2 kitna hota hai?",
    "options": { "A": "3", "B": "4", "C": "5", "D": "6" },
    "correctAnswer": "B"
  }
]
```

## Common mistakes
- Options me A/B/C/D ke alawa kuch aur naam (jaise `"a"` lowercase ya `"Option1"`) — kaam nahi karega, exactly `A`,`B`,`C`,`D` hi likho.
- `correctAnswer` me poora answer text likh dena (jaise `"4"` ki jagah `"B"` ki jagah galti se option ka text) — sirf letter chahiye.
- Last question ke baad extra comma `,` chhod dena — JSON invalid ho jaata hai.
