# Firebase rules — check & lock

Is repo mein Firebase ke **rules** nahi hain, isliye maine unhe check nahi kiya — ye aapko console mein dekhna hoga.
Firebase ki `apiKey` HTML mein public hona normal hai; asli suraksha sirf rules se aati hai.

## Step 1 — automatic check (2 min)
```
node scripts/check-firebase-rules.js
```
`❌ OPEN` dikhe to wo path koi bhi bina login ke padh sakta hai → turant rules band karo.

## Step 2 — write rules check
Firebase console → Realtime Database → Rules → **Rules Playground**: "Simulate **write**" at `/users/test`, `/premium/test`, auth = **Unauthenticated**. Result **Denied** hona chahiye. Firestore ke liye bhi same.

## Step 3 — rules lagana (sirf review ke baad)
`firebase/database.rules.TEMPLATE.json` aur `firebase/firestore.rules.TEMPLATE` **templates** hain, final rules nahi.
Pages `users`, `premium`, `site_config`, `SY/*`, `TY/*` (RTDB) aur `rooms`, `users` (Firestore) client se padhte/likhte hain. Agar aap in rules ko seedha publish karoge to arena/quiz tut sakte hain, kyunki Firebase Auth ab bhi use ho raha hai ya nahi, ye code se pata nahi chalta.
Safe tarika: pehle **Rules Playground** mein apne real flows simulate karo, phir publish karo, phir site par arena + login test karo.
Rollback: console → Rules → History se purana version restore.
