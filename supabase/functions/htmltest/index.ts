import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
serve(() => new Response('<h1>hello html</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-H': 'ok' } }))