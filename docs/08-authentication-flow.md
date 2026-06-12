# 08 — Authentication Flow

> Simple per spec: Google login **or** email + password. Powered by
> Supabase Auth. No server-side session mgmt needed.

## Providers enabled in Supabase

- **Google** — OAuth, requires `https://<project>.supabase.co/auth/v1/callback` as redirect.
- **Email + password** — magic-link optional, password always on.

## Frontend (browser)

```ts
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Google
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/` }
});

// Email + password
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signUp({ email, password });
```

`@supabase/ssr` stores the JWT in an httpOnly cookie, so the browser
never sees the raw token.

## Backend (FastAPI)

A small middleware extracts the JWT, verifies it with
`SUPABASE_JWT_SECRET`, and attaches the user to the request.

```python
from fastapi import Depends, Header, HTTPException
import jwt

async def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization[7:]
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    return {"id": payload["sub"], "email": payload["email"]}
```

Used like:

```python
@router.post("/notes/upload", dependencies=[Depends(current_user)])
async def upload_notes(...): ...
```

## Soft gate (frontend)

The landing + chat pages work **without** auth. The only actions that
require sign-in are:

- Upload notes / PYQ
- Generate PDF (saves to user's storage)

A small `useRequireAuth()` hook opens a "Sign in" modal if those are
clicked while signed-out.

## Sign-out

```ts
await supabase.auth.signOut();
window.location.href = "/";
```

## Security notes

- All Supabase tables have RLS — even if a user crafts a request with
  someone else's `user_id`, Postgres rejects it.
- CORS is restricted to the Vercel domain + `localhost:3000`.
- Service-role key is **only** used by backend for admin operations
  (none in MVP); the browser only ever sees the anon key.
